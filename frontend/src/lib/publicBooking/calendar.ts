import { addDays, addMonths, formatDate, nightsBetween, toIso } from '../format'
import { MAX_NIGHTS, MIN_NIGHTS } from './types'
import type { PublicCalendarDay, PublicCalendarResponse, PublicCalendarRoomType } from './types'

export type CalendarLoadStatus = 'loading' | 'ready' | 'error'

export type DayVisual = 'available' | 'booked' | 'restricted' | 'closed' | 'past' | 'unknown'

const DAY_STATUSES = new Set<PublicCalendarDay['status']>(['available', 'booked', 'restricted', 'closed'])

export function dayStatusCopy(visual: DayVisual, reason: PublicCalendarDay['reason'] | null | undefined) {
  if (visual === 'available') return 'вільно'
  if (visual === 'booked') return 'немає вільних місць'
  if (visual === 'past') return 'минула дата'
  if (visual === 'unknown') return 'наявність ще невідома'
  if (reason === 'occupancy') return 'Кімната не підходить для вибраної кількості гостей'
  if (reason === 'window') return 'Заїзд на цю дату вже недоступний'
  if (reason === 'inactive' || visual === 'closed') return 'Кімната тимчасово недоступна'
  return 'На цю дату немає доступного тарифу'
}

export function visibleCalendarRange(year: number, monthIndex: number) {
  const from = toIso(new Date(year, monthIndex, 1))
  const end = addMonths(year, monthIndex, 2)
  return { from, to: toIso(new Date(end.year, end.monthIndex, 1)) }
}

export function isCalendarResponse(value: PublicCalendarResponse | null | undefined): value is PublicCalendarResponse {
  return Boolean(
    value &&
      value.currency === 'UAH' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.from) &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.to) &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.hotelToday) &&
      Array.isArray(value.roomTypes) &&
      (value.earliestCheckIn === undefined ||
        value.earliestCheckIn === null ||
        /^\d{4}-\d{2}-\d{2}$/.test(value.earliestCheckIn)),
  )
}

export function indexCalendarDays(
  roomTypes: readonly PublicCalendarRoomType[],
  roomTypeId: string,
): Record<string, PublicCalendarDay> {
  const types = roomTypeId ? roomTypes.filter((room) => room.roomTypeId === roomTypeId) : roomTypes
  const grouped = new Map<string, PublicCalendarDay[]>()
  for (const room of types) {
    for (const day of room.days) {
      if (!DAY_STATUSES.has(day.status)) continue
      const list = grouped.get(day.date) ?? []
      list.push(day)
      grouped.set(day.date, list)
    }
  }
  const days: Record<string, PublicCalendarDay> = {}
  for (const [date, options] of grouped) {
    days[date] = combineDays(date, options)
  }
  return days
}

export function dayVisual(
  status: CalendarLoadStatus,
  hotelToday: string | null,
  days: Record<string, PublicCalendarDay>,
  iso: string,
): DayVisual {
  if (status !== 'ready' || !hotelToday) return 'unknown'
  if (iso < hotelToday) return 'past'
  return days[iso]?.status ?? 'unknown'
}

export function canStartCheckIn(
  status: CalendarLoadStatus,
  hotelToday: string | null,
  days: Record<string, PublicCalendarDay>,
  iso: string,
  blockedCheckIns?: ReadonlySet<string>,
  earliestCheckIn?: string | null,
) {
  if (blockedCheckIns?.has(iso)) return false
  if (status !== 'ready' || !hotelToday || iso < hotelToday) return false
  if (earliestCheckIn === null) return false
  if (earliestCheckIn && iso < earliestCheckIn) return false
  const day = days[iso]
  if (!day || day.status !== 'available') return false
  return day.checkInEligible !== false
}

export function canFinishCheckOut(
  status: CalendarLoadStatus,
  hotelToday: string | null,
  days: Record<string, PublicCalendarDay>,
  checkIn: string,
  iso: string,
  blockedRanges?: ReadonlySet<string>,
  earliestCheckIn?: string | null,
) {
  if (blockedRanges?.has(stayKey(checkIn, iso))) return false
  if (!canStartCheckIn(status, hotelToday, days, checkIn, undefined, earliestCheckIn)) return false
  const nights = nightsBetween(checkIn, iso)
  if (nights < MIN_NIGHTS || nights > MAX_NIGHTS) return false
  const limits = limitsForKnownNights(checkIn, iso, days)
  if (!limits || nights < limits.min || nights > limits.max) return false
  const checkout = days[iso]
  if (!checkout || checkout.checkoutEligible === false) return false
  return true
}

function limitsForKnownNights(checkIn: string, checkOut: string, days: Record<string, PublicCalendarDay>) {
  let min = MIN_NIGHTS
  let max = MAX_NIGHTS
  for (const night of stayNights(checkIn, checkOut)) {
    const day = days[night]
    if (!day || day.status !== 'available') return null
    if (typeof day.minStay === 'number') min = Math.max(min, day.minStay)
    if (typeof day.maxStay === 'number') max = Math.min(max, day.maxStay)
  }
  return { min, max }
}

export function stayKey(checkIn: string, checkOut: string) {
  return `${checkIn}|${checkOut}`
}

/**
 * A stay the loaded calendar can already reject. Nights outside the loaded
 * window are not treated as free and are not treated as known-bad.
 */
export function calendarRejectsStay(input: {
  status: CalendarLoadStatus
  hotelToday: string | null
  days: Record<string, PublicCalendarDay>
  checkIn: string
  checkOut: string
  blockedCheckIns?: ReadonlySet<string>
  blockedRanges?: ReadonlySet<string>
  earliestCheckIn?: string | null
}) {
  if (!input.checkIn || !input.checkOut) return false
  if (input.blockedCheckIns?.has(input.checkIn)) return true
  if (input.blockedRanges?.has(stayKey(input.checkIn, input.checkOut))) return true
  const nights = nightsBetween(input.checkIn, input.checkOut)
  if (nights < MIN_NIGHTS || nights > MAX_NIGHTS || input.checkOut <= input.checkIn) return true
  if (input.status !== 'ready' || !input.hotelToday) return false
  const nightsKnown = stayNights(input.checkIn, input.checkOut).every((night) => input.days[night] !== undefined)
  if (!nightsKnown || !input.days[input.checkOut]) {
    if (input.checkIn < input.hotelToday) return true
    const checkInDay = input.days[input.checkIn]
    return Boolean(checkInDay && !canStartCheckIn(input.status, input.hotelToday, input.days, input.checkIn, input.blockedCheckIns, input.earliestCheckIn))
  }
  return !canFinishCheckOut(
    input.status,
    input.hotelToday,
    input.days,
    input.checkIn,
    input.checkOut,
    input.blockedRanges,
    input.earliestCheckIn,
  )
}

export function reconcileStay(input: {
  status: CalendarLoadStatus
  hotelToday: string | null
  days: Record<string, PublicCalendarDay>
  checkIn: string
  checkOut: string
  blockedCheckIns?: ReadonlySet<string>
  blockedRanges?: ReadonlySet<string>
  earliestCheckIn?: string | null
}) {
  if (input.blockedCheckIns?.has(input.checkIn)) return { checkIn: '', checkOut: '' }
  if (input.status !== 'ready' || !input.hotelToday || !input.checkIn) {
    if (input.checkOut && input.blockedRanges?.has(stayKey(input.checkIn, input.checkOut))) {
      return { checkIn: input.checkIn, checkOut: '' }
    }
    return { checkIn: input.checkIn, checkOut: input.checkOut }
  }
  const checkInKnown = Boolean(input.days[input.checkIn])
  if (
    checkInKnown &&
    !canStartCheckIn(input.status, input.hotelToday, input.days, input.checkIn, input.blockedCheckIns, input.earliestCheckIn)
  ) {
    return { checkIn: '', checkOut: '' }
  }
  if (!input.checkOut) return { checkIn: input.checkIn, checkOut: '' }
  if (input.blockedRanges?.has(stayKey(input.checkIn, input.checkOut))) {
    return { checkIn: input.checkIn, checkOut: '' }
  }
  const nights = nightsBetween(input.checkIn, input.checkOut)
  if (nights < MIN_NIGHTS || nights > MAX_NIGHTS) return { checkIn: input.checkIn, checkOut: '' }
  const loadedNights = stayNights(input.checkIn, input.checkOut)
  const fullyLoaded = loadedNights.every((night) => input.days[night] !== undefined) && Boolean(input.days[input.checkOut])
  if (
    fullyLoaded &&
    !canFinishCheckOut(
      input.status,
      input.hotelToday,
      input.days,
      input.checkIn,
      input.checkOut,
      input.blockedRanges,
      input.earliestCheckIn,
    )
  ) {
    return { checkIn: input.checkIn, checkOut: '' }
  }
  const knownBad = loadedNights.some(
    (night) =>
      night < (input.hotelToday ?? '') || (input.days[night] !== undefined && input.days[night]?.status !== 'available'),
  )
  if (knownBad) return { checkIn: input.checkIn, checkOut: '' }
  return { checkIn: input.checkIn, checkOut: input.checkOut }
}

export function selectionAfterStayRejection(
  rejection: { kind: 'check-in' | 'range' | 'guests'; checkIn: string; checkOut: string },
  blockedCheckIns: ReadonlySet<string>,
  blockedRanges: ReadonlySet<string>,
) {
  const nextCheckIns = new Set(blockedCheckIns)
  const nextRanges = new Set(blockedRanges)
  if (rejection.kind === 'guests') {
    return { checkIn: rejection.checkIn, checkOut: rejection.checkOut, blockedCheckIns: nextCheckIns, blockedRanges: nextRanges }
  }
  if (rejection.kind === 'check-in') nextCheckIns.add(rejection.checkIn)
  if (rejection.kind === 'range') nextRanges.add(stayKey(rejection.checkIn, rejection.checkOut))
  return {
    checkIn: '',
    checkOut: '',
    blockedCheckIns: nextCheckIns,
    blockedRanges: nextRanges,
  }
}

export function dayAriaLabel(
  iso: string,
  visual: DayVisual,
  asCheckOut = false,
  reason: PublicCalendarDay['reason'] | null = null,
) {
  const checkout = asCheckOut ? ', можна як дату виїзду' : ''
  return `${formatDate(iso)}, ${dayStatusCopy(visual, reason)}${checkout}`
}

export function capacityExplanation(roomTypes: readonly PublicCalendarRoomType[], roomTypeId: string) {
  if (!roomTypeId) return ''
  const room = roomTypes.find((item) => item.roomTypeId === roomTypeId)
  if (!room || room.days.length === 0) return ''
  if (room.days.every((day) => day.reason === 'occupancy')) {
    return 'Обрана категорія не вміщує стільки гостей.'
  }
  return ''
}

function combineDays(date: string, options: readonly PublicCalendarDay[]): PublicCalendarDay {
  const available = options.filter((day) => day.status === 'available')
  if (available.length > 0) {
    const mins = available.map((day) => day.minStay).filter((value): value is number => typeof value === 'number')
    const maxes = available.map((day) => day.maxStay)
    return {
      date,
      status: 'available',
      availableCount: available.reduce((sum, day) => sum + day.availableCount, 0),
      reason: null,
      checkInEligible: available.some((day) => day.checkInEligible !== false),
      checkoutEligible: available.some((day) => day.checkoutEligible !== false),
      minStay: mins.length > 0 ? Math.min(...mins) : null,
      maxStay: maxes.some((value) => value == null) ? null : Math.max(...maxes.filter((value): value is number => typeof value === 'number')),
    }
  }
  const chosen = options.find((day) => day.status === 'booked') ?? options.find((day) => day.status === 'restricted') ?? options[0]!
  return { ...chosen, date }
}

function stayNights(checkIn: string, checkOut: string) {
  const count = nightsBetween(checkIn, checkOut)
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(checkIn, index))
}

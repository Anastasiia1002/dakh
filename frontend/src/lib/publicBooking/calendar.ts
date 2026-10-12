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
      Array.isArray(value.roomTypes),
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
) {
  return status === 'ready' && Boolean(hotelToday) && iso >= (hotelToday ?? '') && days[iso]?.status === 'available'
}

export function canFinishCheckOut(
  status: CalendarLoadStatus,
  hotelToday: string | null,
  days: Record<string, PublicCalendarDay>,
  checkIn: string,
  iso: string,
) {
  if (!canStartCheckIn(status, hotelToday, days, checkIn)) return false
  const nights = nightsBetween(checkIn, iso)
  if (nights < MIN_NIGHTS || nights > MAX_NIGHTS) return false
  return stayNights(checkIn, iso).every((night) => days[night]?.status === 'available')
}

export function reconcileStay(input: {
  status: CalendarLoadStatus
  hotelToday: string | null
  days: Record<string, PublicCalendarDay>
  checkIn: string
  checkOut: string
}) {
  if (input.status !== 'ready' || !input.hotelToday || !input.checkIn) {
    return { checkIn: input.checkIn, checkOut: input.checkOut }
  }
  const checkInKnown = Boolean(input.days[input.checkIn])
  if (checkInKnown && !canStartCheckIn(input.status, input.hotelToday, input.days, input.checkIn)) {
    return { checkIn: '', checkOut: '' }
  }
  if (!input.checkOut) return { checkIn: input.checkIn, checkOut: '' }
  const knownBad = stayNights(input.checkIn, input.checkOut).some(
    (night) =>
      night < (input.hotelToday ?? '') || (input.days[night] !== undefined && input.days[night]?.status !== 'available'),
  )
  if (knownBad) return { checkIn: input.checkIn, checkOut: '' }
  return { checkIn: input.checkIn, checkOut: input.checkOut }
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
    return {
      date,
      status: 'available',
      availableCount: available.reduce((sum, day) => sum + day.availableCount, 0),
      reason: null,
    }
  }
  return options.find((day) => day.status === 'booked') ?? options.find((day) => day.status === 'restricted') ?? options[0]!
}

function stayNights(checkIn: string, checkOut: string) {
  const count = nightsBetween(checkIn, checkOut)
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(checkIn, index))
}

import { addDays, nightsBetween, todayIso } from '../format'
import type {
  PublicAvailabilityQuery,
  PublicAvailabilityRatePlan,
  PublicAvailabilityResponse,
  PublicAvailabilityRoomType,
  PublicCalendarQuery,
  PublicQuoteRequest,
  PublicQuoteResponse,
  PublicRateType,
  PublicServiceSelection,
} from './types'
import { canonicalServiceSelection, serviceSelectionKey } from './publicServices'
import { DATE_PATTERN, MAX_GUESTS, MAX_NIGHTS, MIN_GUESTS, MIN_NIGHTS } from './types'

export type StaySearch = {
  checkIn: string
  checkOut: string
  guestCount: number
  adults?: number
  children?: number
  roomTypeId?: string
  ratePlanId?: string | null
  servicesKey?: string
}

export type GuestComposition = {
  adults: number
  children: number
  guestCount: number
}

/**
 * Adults and children stay separate. guestCount is their sum.
 * `capacity` limits adults only. Children are informational and do not consume it.
 * Invalid counts are rejected rather than rewritten into a different split.
 */
export function guestComposition(adults: number, children: number, capacity = MAX_GUESTS): GuestComposition | null {
  if (!Number.isInteger(adults) || !Number.isInteger(children) || !Number.isInteger(capacity)) return null
  if (adults < 1 || children < 0) return null
  if (adults > MAX_GUESTS || children > MAX_GUESTS || capacity < MIN_GUESTS) return null
  if (adults > capacity) return null
  const guestCount = adults + children
  if (guestCount < MIN_GUESTS || guestCount > MAX_GUESTS) return null
  return { adults, children, guestCount }
}

export function guestCountOf(adults: number, children: number) {
  return guestComposition(adults, children)?.guestCount ?? 0
}

function wholeGuestParam(value: string | null, fallback: number) {
  if (value == null || value.trim() === '') return fallback
  if (!/^\d+$/.test(value.trim())) return Number.NaN
  return Number(value)
}

/** URL drafts stay on a valid split. Zero adults become the default of 2; children are kept. */
export function guestDraftFromParams(adultsRaw: string | null, childrenRaw: string | null): GuestComposition {
  const adultsParsed = wholeGuestParam(adultsRaw, 2)
  const childrenParsed = wholeGuestParam(childrenRaw, 0)
  const adults = Number.isInteger(adultsParsed) && adultsParsed >= 1 ? adultsParsed : 2
  const children = Number.isInteger(childrenParsed) && childrenParsed >= 0 ? childrenParsed : 0
  return guestComposition(adults, children) ?? { adults: 2, children: 0, guestCount: 2 }
}

export function publicQuoteBody(input: {
  checkIn: string
  checkOut: string
  adults: number
  children: number
  roomTypeId: string
  ratePlanId: string
  services?: readonly PublicServiceSelection[]
}): PublicQuoteRequest | null {
  const split = guestComposition(input.adults, input.children)
  if (!split) return null
  const services = canonicalServiceSelection(input.services)
  return {
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guestCount: split.guestCount,
    adults: split.adults,
    children: split.children,
    roomTypeId: input.roomTypeId,
    ratePlanId: input.ratePlanId,
    ...(services.length > 0 ? { services } : {}),
  }
}

/** The intent must repeat the split the quote was issued for. */
export function intentStayFromQuote(
  quote: Pick<PublicQuoteResponse, 'guestCount' | 'adults' | 'children'>,
): GuestComposition | null {
  const split = guestComposition(quote.adults, quote.children)
  if (!split || split.guestCount !== quote.guestCount) return null
  return split
}

export function quoteRequestKey(input: {
  hotel: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  roomTypeId: string
  ratePlanId: string
  kind?: string
  servicesKey?: string
}) {
  const split = guestComposition(input.adults, input.children)
  if (!split) return ''
  return [
    input.hotel,
    input.checkIn,
    input.checkOut,
    String(split.guestCount),
    String(split.adults),
    String(split.children),
    input.kind ?? '',
    input.roomTypeId,
    input.ratePlanId,
    input.servicesKey ?? '',
  ].join('|')
}

export function isIsoDate(value: string) {
  return DATE_PATTERN.test(value)
}

export function stayNights(checkIn: string, checkOut: string) {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return 0
  return nightsBetween(checkIn, checkOut)
}

export function stayIsSearchable(checkIn: string, checkOut: string, guestCount: number) {
  const nights = stayNights(checkIn, checkOut)
  return (
    nights >= MIN_NIGHTS &&
    nights <= MAX_NIGHTS &&
    checkOut > checkIn &&
    guestCount >= MIN_GUESTS &&
    guestCount <= MAX_GUESTS
  )
}

export function canUseAsCheckIn(iso: string) {
  return isIsoDate(iso) && iso >= todayIso()
}

export function canUseAsCheckOut(checkIn: string, iso: string) {
  if (!canUseAsCheckIn(checkIn) || !isIsoDate(iso) || iso <= checkIn) return false
  const nights = nightsBetween(checkIn, iso)
  return nights >= MIN_NIGHTS && nights <= MAX_NIGHTS
}

export function latestCheckOut(checkIn: string) {
  return addDays(checkIn, MAX_NIGHTS)
}

export function roomKindLabel(kind: 'ROOM' | 'COTTAGE') {
  return kind === 'COTTAGE' ? 'Садиба' : 'Кімната'
}

export function rateTypeLabel(type: PublicRateType) {
  if (type === 'NON_REFUNDABLE') return 'Неповернений'
  if (type === 'SPECIAL') return 'Спеціальний'
  return 'Стандарт'
}

export function findRatePlan(
  room: PublicAvailabilityRoomType | undefined,
  ratePlanId: string,
): PublicAvailabilityRatePlan | undefined {
  return room?.ratePlans.find((plan) => plan.ratePlanId === ratePlanId)
}

export function soleRatePlanId(room: PublicAvailabilityRoomType) {
  return room.ratePlans.length === 1 ? (room.ratePlans[0]?.ratePlanId ?? '') : ''
}

export function compareRateTotals(left: string, right: string) {
  const a = Number(left)
  const b = Number(right)
  if (a === b) return 0
  if (!Number.isFinite(a) || !Number.isFinite(b)) return left.localeCompare(right)
  return a < b ? -1 : 1
}

/** Lowest payable total, then stable plan id. */
export function selectEligibleRatePlan<T extends { ratePlanId: string; totalAmount: string }>(plans: readonly T[]) {
  if (plans.length === 0) return null
  return [...plans].sort(
    (left, right) => compareRateTotals(left.totalAmount, right.totalAmount) || left.ratePlanId.localeCompare(right.ratePlanId),
  )[0] ?? null
}

export function selectedRatePlanId(room: PublicAvailabilityRoomType | undefined) {
  return selectEligibleRatePlan(room?.ratePlans ?? [])?.ratePlanId ?? ''
}

export function rateConditions(type: PublicRateType) {
  if (type === 'NON_REFUNDABLE') return 'Неповернений тариф: у разі скасування оплата не повертається.'
  if (type === 'SPECIAL') return 'Особливі умови цього тарифу. Перевірте їх перед підтвердженням.'
  return 'Стандартні умови скасування готелю.'
}

export function ratePlanIdForRoom(room: PublicAvailabilityRoomType | undefined, _currentRatePlanId: string) {
  return selectedRatePlanId(room)
}

export function shouldApplyResponse(requestedKey: string, latestKey: string) {
  return Boolean(requestedKey) && requestedKey === latestKey
}

/** Automatic quote requests stay off unless booking writes are explicitly enabled. */
export function shouldRequestQuote(bookingEnabled: boolean, quoteKey: string) {
  return bookingEnabled && quoteKey.length > 0
}

/** Staging seed tariff. It must never become a guest-facing price. */
export const HIDDEN_TEST_RATE_CODE = 'catalog-test-100'

/** Client-visible staging QA tariff. Must be labeled as a demonstration price. */
export const STAGING_DEMO_RATE_CODE = 'staging-public-e2e'

/** Published client-test nightly amount. Not a commercial tariff. */
export const DEMO_NIGHTLY_UAH = '2000.00'

export const DEMO_PRICE_COPY =
  '2 000 ₴ за ніч — демонстраційна ціна для тесту, не комерційний тариф. Оплата не стягується.'

export function isDemoNightlyAmount(amount: string | null | undefined): boolean {
  if (!amount) return false
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim())
  if (!match) return false
  const fraction = (match[2] ?? '').padEnd(2, '0')
  return match[1] === '2000' && fraction === '00'
}

export function isDemoQuotedStay(nights: readonly { price: string }[]): boolean {
  return nights.length > 0 && nights.every((night) => isDemoNightlyAmount(night.price))
}

export function isDemoStayTotal(total: string, nights: number): boolean {
  if (!Number.isInteger(nights) || nights < 1) return false
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(total.trim())
  if (!match) return false
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return cents === nights * 200_000
}

export function isDemoRate(plan: { demo?: boolean; code?: string; name?: string; nightlyStartingPrice?: string | null }) {
  if (plan.demo === true || isDemoNightlyAmount(plan.nightlyStartingPrice)) return true
  const blob = `${plan.code ?? ''} ${plan.name ?? ''}`.toLowerCase()
  return blob.includes(STAGING_DEMO_RATE_CODE) || blob.includes('staging public e2e')
}

export const CAPACITY_BLOCK_COPY = 'Це помешкання не вміщує стільки дорослих.'

export const MISSING_PUBLIC_PRICE_COPY =
  'Публічної ціни для цих дат немає. Бронювання недоступне, доки з’явиться тариф.'

/** Room capacity is the adult count. Children do not consume it. */
export function roomAcceptsAdults(room: { maxGuests: number } | undefined, adults: number) {
  if (!room) return false
  return adults >= MIN_GUESTS && adults <= MAX_GUESTS && adults <= room.maxGuests
}

export function roomAcceptsGuestCount(room: { maxGuests: number } | undefined, adults: number) {
  return roomAcceptsAdults(room, adults)
}

export function availabilityQueryFromParty(input: {
  checkIn: string
  checkOut: string
  adults: number
  children: number
  roomTypeId?: string
  kind?: 'ROOM' | 'COTTAGE'
}): PublicAvailabilityQuery | null {
  const split = guestComposition(input.adults, input.children)
  if (!split) return null
  return {
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guestCount: split.guestCount,
    adults: split.adults,
    children: split.children,
    ...(input.roomTypeId ? { roomTypeId: input.roomTypeId } : {}),
    ...(input.kind ? { kind: input.kind } : {}),
  }
}

export function calendarQueryFromParty(input: {
  from: string
  to: string
  adults: number
  children: number
  roomTypeId?: string
}): PublicCalendarQuery | null {
  const split = guestComposition(input.adults, input.children)
  if (!split) return null
  return {
    from: input.from,
    to: input.to,
    guestCount: split.guestCount,
    adults: split.adults,
    children: split.children,
    ...(input.roomTypeId ? { roomTypeId: input.roomTypeId } : {}),
  }
}

/**
 * A children-only change keeps the selected room and rate.
 * Dates are left to the caller. An adult, date, or room change still resets the rate.
 */
export function roomSelectionAfterStayPatch(input: {
  locked: boolean
  roomTypeId: string
  ratePlanId: string
  next: {
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
    roomTypeId?: string
    ratePlanId?: string
  }
}) {
  const next = input.next
  const childrenOnly =
    next.children !== undefined &&
    next.adults === undefined &&
    next.checkIn === undefined &&
    next.checkOut === undefined &&
    next.roomTypeId === undefined
  const stayChanged =
    next.checkIn !== undefined ||
    next.checkOut !== undefined ||
    next.adults !== undefined ||
    next.children !== undefined
  let roomTypeId = next.roomTypeId !== undefined ? next.roomTypeId : input.roomTypeId
  let ratePlanId = next.ratePlanId !== undefined ? next.ratePlanId : input.ratePlanId
  if (stayChanged) {
    if (!childrenOnly) {
      if (!input.locked && next.roomTypeId === undefined) roomTypeId = ''
      if (next.ratePlanId === undefined) ratePlanId = ''
    }
  } else if (next.roomTypeId !== undefined && next.ratePlanId === undefined) {
    ratePlanId = ''
  }
  if (input.locked) roomTypeId = input.roomTypeId
  return { roomTypeId, ratePlanId }
}

export function isHiddenTestRate(plan: { ratePlanId?: string; name?: string; code?: string }) {
  const blob = `${plan.code ?? ''} ${plan.name ?? ''} ${plan.ratePlanId ?? ''}`.toLowerCase()
  return blob.includes(HIDDEN_TEST_RATE_CODE)
}

/** Plans a guest may be quoted. Test tariffs and amounts the server did not price are dropped. */
export function offerableRatePlans<T extends PublicAvailabilityRatePlan & { code?: string }>(plans: readonly T[]): T[] {
  return plans.filter((plan) => !isHiddenTestRate(plan) && authoritativeStayTotal(plan) !== null)
}

const DECIMAL_MONEY = /^(?:0|[1-9]\d*)\.\d{2}$/

/** Stay total from an availability rate plan. Nightly catalog or starting prices are not a total. */
export function authoritativeStayTotal(
  plan: { totalAmount: string; currency: string } | null | undefined,
): string | null {
  if (!plan || plan.currency !== 'UAH') return null
  if (!DECIMAL_MONEY.test(plan.totalAmount)) return null
  return plan.totalAmount
}

export function availabilitySearchStatus(input: {
  searchable: boolean
  configured: boolean
  settled: boolean
  error: string
  roomCount: number
}): 'idle' | 'loading' | 'ready' | 'empty' | 'error' {
  if (!input.searchable) return 'idle'
  if (!input.configured) return 'error'
  if (!input.settled) return 'loading'
  if (input.error) return 'error'
  if (input.roomCount > 0) return 'ready'
  return 'empty'
}

export function availabilityMatchesSearch(
  response: PublicAvailabilityResponse,
  search: StaySearch,
) {
  return response.checkIn === search.checkIn && response.checkOut === search.checkOut
}

export function quoteMatchesSearch(quote: PublicQuoteResponse, search: StaySearch) {
  const splitKnown = search.adults != null && search.children != null
  const splitMatches =
    !splitKnown ||
    (quote.adults === search.adults &&
      quote.children === search.children &&
      quote.adults + quote.children === quote.guestCount)
  return (
    quote.checkIn === search.checkIn &&
    quote.checkOut === search.checkOut &&
    quote.guestCount === search.guestCount &&
    splitMatches &&
    quote.roomTypeId === search.roomTypeId &&
    Boolean(search.ratePlanId) &&
    quote.ratePlanId === search.ratePlanId &&
    serviceSelectionKey(quote.services) === (search.servicesKey ?? '')
  )
}

import { addDays, nightsBetween, todayIso } from '../format'
import type {
  PublicAvailabilityRatePlan,
  PublicAvailabilityResponse,
  PublicAvailabilityRoomType,
  PublicQuoteResponse,
  PublicRateType,
} from './types'
import { DATE_PATTERN, MAX_GUESTS, MAX_NIGHTS, MIN_GUESTS, MIN_NIGHTS } from './types'

export type StaySearch = {
  checkIn: string
  checkOut: string
  guestCount: number
  roomTypeId?: string
  ratePlanId?: string | null
}

export function guestCountOf(adults: number, children: number) {
  return Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, adults + children))
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

export function ratePlanIdForRoom(room: PublicAvailabilityRoomType | undefined, currentRatePlanId: string) {
  if (!room) return ''
  if (findRatePlan(room, currentRatePlanId)) return currentRatePlanId
  return soleRatePlanId(room)
}

export function shouldApplyResponse(requestedKey: string, latestKey: string) {
  return Boolean(requestedKey) && requestedKey === latestKey
}

export function availabilityMatchesSearch(
  response: PublicAvailabilityResponse,
  search: StaySearch,
) {
  return response.checkIn === search.checkIn && response.checkOut === search.checkOut
}

export function quoteMatchesSearch(quote: PublicQuoteResponse, search: StaySearch) {
  return (
    quote.checkIn === search.checkIn &&
    quote.checkOut === search.checkOut &&
    quote.guestCount === search.guestCount &&
    quote.roomTypeId === search.roomTypeId &&
    Boolean(search.ratePlanId) &&
    quote.ratePlanId === search.ratePlanId
  )
}

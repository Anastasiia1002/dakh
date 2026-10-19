import {
  apiHotelSlug,
  categoryForApiHotel,
  isAccommodationCategory,
  toApiAccommodationSlug,
  toPublicAccommodationSlug,
  type AccommodationMapEnv,
} from '../catalog/categories'
import { stayIsSearchable } from './stay'
import { DATE_PATTERN, MAX_GUESTS, MIN_GUESTS } from './types'

const STORAGE_KEY = 'dakh-booking-handoff'
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/

export type BookingHandoffPreview = {
  totalAmount: string
  currency: 'UAH'
}

/** Non-secret stay context. Price preview is display-only and is never submitted. */
export type BookingHandoff = {
  hotelSlug: string
  catalogSlug: string
  roomTypeId: string
  roomTypeSlug: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  ratePlanId: string
  preview: BookingHandoffPreview | null
}

function isSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value) && value.length <= 80
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function isCount(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function readCount(value: string | null, min: number, max: number) {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  if (parsed < min || parsed > max) return null
  return parsed
}

export function parseBookingHandoff(value: unknown): BookingHandoff | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const hotelSlug = raw.hotelSlug
  const catalogSlug = raw.catalogSlug
  const roomTypeId = raw.roomTypeId
  const roomTypeSlug = raw.roomTypeSlug
  const checkIn = raw.checkIn
  const checkOut = raw.checkOut
  const adults = raw.adults
  const children = raw.children
  const ratePlanId = raw.ratePlanId
  if (!isSlug(hotelSlug) || !isSlug(catalogSlug) || !isUuid(roomTypeId) || !isSlug(roomTypeSlug)) return null
  if (typeof checkIn !== 'string' || typeof checkOut !== 'string') return null
  if (!DATE_PATTERN.test(checkIn) || !DATE_PATTERN.test(checkOut)) return null
  if (!isCount(adults, 1, MAX_GUESTS) || !isCount(children, 0, MAX_GUESTS)) return null
  if (adults + children < MIN_GUESTS || adults + children > MAX_GUESTS) return null
  if (!stayIsSearchable(checkIn, checkOut, adults + children)) return null
  if (!(ratePlanId === '' || isUuid(ratePlanId))) return null
  const preview = parsePreview(raw.preview)
  return {
    hotelSlug,
    catalogSlug,
    roomTypeId,
    roomTypeSlug,
    checkIn,
    checkOut,
    adults,
    children,
    ratePlanId,
    preview,
  }
}

function parsePreview(value: unknown): BookingHandoffPreview | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.currency !== 'UAH' || typeof raw.totalAmount !== 'string' || !MONEY_PATTERN.test(raw.totalAmount)) return null
  return { totalAmount: raw.totalAmount, currency: 'UAH' }
}

export function handoffToSearch(handoff: BookingHandoff) {
  const params = new URLSearchParams()
  const cottageSlug =
    /^sunny-park-\d+$/.test(handoff.roomTypeSlug) || /^house-\d+$/.test(handoff.catalogSlug)
  const category = cottageSlug ? 'houses' : (categoryForApiHotel(handoff.hotelSlug) ?? 'rooms')
  if (category) {
    params.set('category', category)
    params.set('room', toPublicAccommodationSlug(category, handoff.roomTypeSlug || handoff.catalogSlug))
  } else {
    params.set('hotel', handoff.hotelSlug)
    params.set('room', handoff.catalogSlug)
    params.set('type', handoff.roomTypeSlug)
  }
  params.set('roomType', handoff.roomTypeId)
  params.set('from', handoff.checkIn)
  params.set('to', handoff.checkOut)
  params.set('adults', String(handoff.adults))
  params.set('children', String(handoff.children))
  return params
}

export function handoffFromSearch(params: URLSearchParams, env?: AccommodationMapEnv): BookingHandoff | null {
  const adults = readCount(params.get('adults'), 1, MAX_GUESTS)
  const children = readCount(params.get('children'), 0, MAX_GUESTS)
  if (adults === null || children === null) return null
  const category = params.get('category')
  const room = params.get('room')
  if (isAccommodationCategory(category) && room) {
    const apiSlug = toApiAccommodationSlug(category, room)
    const hotelSlug = apiHotelSlug(category, env)
    if (!apiSlug || !hotelSlug) return null
    return parseBookingHandoff({
      hotelSlug,
      catalogSlug: room,
      roomTypeId: params.get('roomType'),
      roomTypeSlug: params.get('type') || apiSlug,
      checkIn: params.get('from'),
      checkOut: params.get('to'),
      adults,
      children,
      ratePlanId: '',
      preview: null,
    })
  }
  return parseBookingHandoff({
    hotelSlug: params.get('hotel'),
    catalogSlug: room,
    roomTypeId: params.get('roomType'),
    roomTypeSlug: params.get('type'),
    checkIn: params.get('from'),
    checkOut: params.get('to'),
    adults,
    children,
    ratePlanId: '',
    preview: null,
  })
}

function sameRoom(left: BookingHandoff, right: BookingHandoff) {
  return (
    left.hotelSlug === right.hotelSlug &&
    left.catalogSlug === right.catalogSlug &&
    left.roomTypeId === right.roomTypeId &&
    left.roomTypeSlug === right.roomTypeSlug
  )
}

export function resolveBookingHandoff(input: {
  state: unknown
  params: URLSearchParams
  stored: BookingHandoff | null
}): BookingHandoff | null {
  const fromState =
    input.state && typeof input.state === 'object' && 'handoff' in input.state
      ? parseBookingHandoff((input.state as { handoff?: unknown }).handoff)
      : null
  const fromUrl = handoffFromSearch(input.params)
  const base = fromState ?? fromUrl
  if (!base) return null
  if (!input.stored || !sameRoom(input.stored, base)) return base
  return {
    ...base,
    ratePlanId: input.stored.ratePlanId || base.ratePlanId,
    preview: fromState?.preview ?? input.stored.preview,
  }
}

export function loadBookingHandoff(): BookingHandoff | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseBookingHandoff(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveBookingHandoff(handoff: BookingHandoff) {
  if (typeof sessionStorage === 'undefined') return
  const parsed = parseBookingHandoff(handoff)
  if (!parsed) return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
}

export function clearBookingHandoff() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

const ROOM_LABEL_KEY = 'dakh-booking-room-label'

/** Catalog display name for a verified room type. Never stores emails, phones, or prices. */
export function rememberRoomDisplayName(roomTypeId: string, name: string) {
  if (typeof sessionStorage === 'undefined' || !isUuid(roomTypeId)) return
  const label = name.trim()
  if (!label || label.length > 120 || /^e2e(?:\s|$)/i.test(label)) return
  sessionStorage.setItem(ROOM_LABEL_KEY, JSON.stringify({ roomTypeId, label }))
}

export function readRoomDisplayName(roomTypeId: string) {
  if (typeof sessionStorage === 'undefined' || !isUuid(roomTypeId)) return null
  try {
    const raw = JSON.parse(sessionStorage.getItem(ROOM_LABEL_KEY) ?? 'null') as { roomTypeId?: unknown; label?: unknown }
    if (raw?.roomTypeId !== roomTypeId || typeof raw.label !== 'string') return null
    if (!raw.label.trim() || /^e2e(?:\s|$)/i.test(raw.label)) return null
    return raw.label
  } catch {
    return null
  }
}

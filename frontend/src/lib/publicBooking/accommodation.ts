import { PublicApiError } from './errors'
import type {
  PublicAccommodation,
  PublicAccommodationImage,
  PublicAccommodationListResponse,
  PublicAmenity,
  PublicHotelSlug,
  PublicRoomKind,
} from './types'

const HOTEL_SLUGS: readonly PublicHotelSlug[] = ['dakh', 'sunny-park']

export function isPublicHotelSlug(value: string): value is PublicHotelSlug {
  return (HOTEL_SLUGS as readonly string[]).includes(value)
}

function invalidCatalog(): never {
  throw new PublicApiError({
    statusCode: 200,
    error: 'VALIDATION_ERROR',
    message: 'Некоректна відповідь сервера.',
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) invalidCatalog()
  return value
}

function parseImage(value: unknown): PublicAccommodationImage {
  if (!isRecord(value)) invalidCatalog()
  const url = requiredString(value.url)
  if (typeof value.alt !== 'string') invalidCatalog()
  if (typeof value.sortOrder !== 'number' || !Number.isInteger(value.sortOrder)) invalidCatalog()
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    invalidCatalog()
  }
  if (parsed.protocol !== 'https:') invalidCatalog()
  return { url, alt: value.alt, sortOrder: value.sortOrder }
}

function parseAmenity(value: unknown): PublicAmenity {
  if (!isRecord(value)) invalidCatalog()
  if (typeof value.sortOrder !== 'number' || !Number.isInteger(value.sortOrder)) invalidCatalog()
  const category = requiredString(value.category)
  if (!/^[A-Z0-9_]+$/.test(category)) invalidCatalog()
  return {
    key: requiredString(value.key),
    label: requiredString(value.label),
    category,
    iconKey: requiredString(value.iconKey),
    sortOrder: value.sortOrder,
  }
}

function parseAmenities(value: unknown): PublicAmenity[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) invalidCatalog()
  return value.map(parseAmenity)
}

function parseKind(value: unknown): PublicRoomKind {
  if (value !== 'ROOM' && value !== 'COTTAGE') invalidCatalog()
  return value
}

function parseAccommodation(value: unknown, hotelSlug: PublicHotelSlug): PublicAccommodation {
  if (!isRecord(value)) invalidCatalog()
  if (value.hotelSlug !== hotelSlug) invalidCatalog()
  if (typeof value.description !== 'string') invalidCatalog()
  if (typeof value.maxGuests !== 'number' || !Number.isInteger(value.maxGuests) || value.maxGuests < 1) {
    invalidCatalog()
  }
  if (!Array.isArray(value.images)) invalidCatalog()
  const amenities = parseAmenities(value.amenities)
  return {
    id: requiredString(value.id),
    slug: requiredString(value.slug),
    name: requiredString(value.name),
    kind: parseKind(value.kind),
    description: value.description,
    maxGuests: value.maxGuests,
    images: value.images.map(parseImage),
    cover: parseImage(value.cover),
    ...(amenities === undefined ? {} : { amenities }),
    hotelSlug,
  }
}

export function parseAccommodationList(payload: unknown, hotelSlug: PublicHotelSlug): PublicAccommodationListResponse {
  if (!isRecord(payload) || !Array.isArray(payload.accommodations)) invalidCatalog()
  if (payload.hotelSlug !== hotelSlug) invalidCatalog()
  return {
    hotelSlug,
    accommodations: payload.accommodations.map((item) => parseAccommodation(item, hotelSlug)),
  }
}

export function parseAccommodationDetail(payload: unknown, hotelSlug: PublicHotelSlug): PublicAccommodation {
  return parseAccommodation(payload, hotelSlug)
}

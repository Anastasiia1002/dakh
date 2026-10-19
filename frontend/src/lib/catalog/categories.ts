import type { PublicHotelSlug } from '../publicBooking/types'
import { accommodationApiHotel, type AccommodationMapEnv } from './hotelMap'

export type { AccommodationHotelMap, AccommodationMapEnv } from './hotelMap'
export { accommodationHotelMapError } from './hotelMap'

/** Customer-facing accommodation categories. API hotel slugs stay behind this module. */
export type AccommodationCategory = 'rooms' | 'houses'

/**
 * Explicit catalog routing. This is not inferred from the build mode.
 * `split` is production before the one-hotel migration.
 * `merged` is staging after that migration, and production only after its own migration.
 */

export const CATALOG_MAP_MISSING_COPY =
  'Каталог зараз не налаштований. Список кімнат і будинків не запитується.'

function readMapEnv(): AccommodationMapEnv {
  const env = import.meta.env
  if (!env) return {}
  return {
    VITE_ACCOMMODATION_HOTEL_MAP: env.VITE_ACCOMMODATION_HOTEL_MAP,
    VITE_PUBLIC_HOTEL_SLUG: env.VITE_PUBLIC_HOTEL_SLUG,
  }
}

export function isAccommodationCategory(value: string | null | undefined): value is AccommodationCategory {
  return value === 'rooms' || value === 'houses'
}

/** API hotel for a public category. Null when the map is missing or inconsistent, so no hotel is guessed. */
export function apiHotelSlug(
  category: AccommodationCategory,
  env: AccommodationMapEnv = readMapEnv(),
): PublicHotelSlug | null {
  return accommodationApiHotel(category, env)
}

export function accommodationsInCategory<T extends { kind: 'ROOM' | 'COTTAGE' }>(
  items: readonly T[],
  category: AccommodationCategory,
): T[] {
  return items.filter((item) => categoryForKind(item.kind) === category)
}

/** A stored cottage handoff may still say sunny-park after the hotel merge. Requests use the mapped hotel. */
export function bookingHotelMatchesCategory(
  handoffHotel: string,
  category: AccommodationCategory,
  env: AccommodationMapEnv = readMapEnv(),
): boolean {
  const apiHotel = apiHotelSlug(category, env)
  if (!apiHotel) return false
  if (handoffHotel === apiHotel) return true
  return category === 'houses' && apiHotel === 'dakh' && handoffHotel === 'sunny-park'
}

export function canonicalHotelSlug(hotelSlug: string): PublicHotelSlug | null {
  if (hotelSlug === 'dakh' || hotelSlug === 'sunny-park') return 'dakh'
  return null
}

export function categoryForApiHotel(hotelSlug: string): AccommodationCategory | null {
  if (hotelSlug === 'sunny-park') return 'houses'
  if (hotelSlug === 'dakh') return 'rooms'
  return null
}

export function categoryBase(category: AccommodationCategory): '/rooms' | '/houses' {
  return category === 'rooms' ? '/rooms' : '/houses'
}

export function categoryLabel(category: AccommodationCategory): 'Кімнати' | 'Будинки' {
  return category === 'rooms' ? 'Кімнати' : 'Будинки'
}

/** Public path slug. House API slugs never stay in the address bar. */
export function toPublicAccommodationSlug(category: AccommodationCategory, apiSlug: string): string {
  if (category !== 'houses') return apiSlug
  const match = /^sunny-park-(\d+)$/.exec(apiSlug.trim().toLowerCase())
  return match ? `house-${match[1]}` : apiSlug
}

/** Stored API slug for a public path segment. Null when the segment is not in that category. */
export function toApiAccommodationSlug(category: AccommodationCategory, publicSlug: string): string | null {
  const slug = publicSlug.trim().toLowerCase()
  if (!slug) return null
  if (category === 'rooms') {
    if (slug.startsWith('sunny-park') || slug.startsWith('house-')) return null
    return slug
  }
  const house = /^house-(\d+)$/.exec(slug)
  if (house) return `sunny-park-${house[1]}`
  const legacy = /^sunny-park-(\d+)$/.exec(slug)
  if (legacy) return slug
  return null
}

/** Real catalog hotels, plus the configured slug used by staging fixtures. */
export function acceptsBookingHotel(hotelSlug: string, configuredSlug: string): boolean {
  return Boolean(canonicalHotelSlug(hotelSlug)) || hotelSlug === configuredSlug
}

export function categoryForKind(kind: 'ROOM' | 'COTTAGE'): AccommodationCategory {
  return kind === 'COTTAGE' ? 'houses' : 'rooms'
}

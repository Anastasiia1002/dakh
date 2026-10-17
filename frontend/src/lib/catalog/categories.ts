import type { PublicHotelSlug } from '../publicBooking/types'

/** Customer-facing accommodation categories. API hotel slugs stay behind this module. */
export type AccommodationCategory = 'rooms' | 'houses'

const API_HOTEL = {
  rooms: 'dakh',
  houses: 'sunny-park',
} as const satisfies Record<AccommodationCategory, PublicHotelSlug>

export function isAccommodationCategory(value: string | null | undefined): value is AccommodationCategory {
  return value === 'rooms' || value === 'houses'
}

export function apiHotelSlug(category: AccommodationCategory): PublicHotelSlug {
  return API_HOTEL[category]
}

export function categoryForApiHotel(hotelSlug: string): AccommodationCategory | null {
  if (hotelSlug === API_HOTEL.rooms) return 'rooms'
  if (hotelSlug === API_HOTEL.houses) return 'houses'
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
  return Boolean(categoryForApiHotel(hotelSlug)) || hotelSlug === configuredSlug
}

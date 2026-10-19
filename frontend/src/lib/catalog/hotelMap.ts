export type AccommodationHotelMap = 'split' | 'merged'

export type AccommodationMapEnv = {
  VITE_ACCOMMODATION_HOTEL_MAP?: string
  VITE_PUBLIC_HOTEL_SLUG?: string
}

type Category = 'rooms' | 'houses'
type Hotel = 'dakh' | 'sunny-park'

const API_HOTEL = {
  split: { rooms: 'dakh', houses: 'sunny-park' },
  merged: { rooms: 'dakh', houses: 'dakh' },
} as const satisfies Record<AccommodationHotelMap, Record<Category, Hotel>>

/** Missing and inconsistent values fail closed. Build mode is not an input. */
export function accommodationHotelMapError(env: AccommodationMapEnv): string | null {
  const map = env.VITE_ACCOMMODATION_HOTEL_MAP
  if (map !== 'split' && map !== 'merged') {
    return 'VITE_ACCOMMODATION_HOTEL_MAP must be exactly split or merged.'
  }
  const hotel = env.VITE_PUBLIC_HOTEL_SLUG?.trim().toLowerCase()
  if (hotel && hotel !== 'dakh') {
    return 'VITE_PUBLIC_HOTEL_SLUG must be dakh. Cottage routing belongs to VITE_ACCOMMODATION_HOTEL_MAP.'
  }
  return null
}

export function accommodationApiHotel(category: Category, env: AccommodationMapEnv): Hotel | null {
  const map = env.VITE_ACCOMMODATION_HOTEL_MAP
  if (accommodationHotelMapError(env) || (map !== 'split' && map !== 'merged')) return null
  return API_HOTEL[map][category]
}

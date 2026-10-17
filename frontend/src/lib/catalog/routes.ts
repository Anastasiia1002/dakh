import {
  categoryBase,
  categoryForApiHotel,
  toPublicAccommodationSlug,
  type AccommodationCategory,
} from './categories'
import type { PublicHotelSlug } from '../publicBooking/types'

const FICTIONAL_SLUGS = new Set(['bukovyna', 'goryshche', 'plats'])

export function isFictionalAccommodationSlug(slug: string): boolean {
  return FICTIONAL_SLUGS.has(slug.trim().toLowerCase())
}

export function accommodationBase(hotel: PublicHotelSlug): '/rooms' | '/houses' {
  return categoryBase(categoryForApiHotel(hotel) ?? 'rooms')
}

export function accommodationPath(hotel: PublicHotelSlug, apiSlug?: string): string {
  const category = categoryForApiHotel(hotel) ?? 'rooms'
  const base = categoryBase(category)
  if (!apiSlug) return base
  return `${base}/${encodeURIComponent(toPublicAccommodationSlug(category, apiSlug.trim()))}`
}

function roomTarget(slug: string): string {
  const normalized = slug.trim()
  if (!normalized || isFictionalAccommodationSlug(normalized)) return '/rooms'
  return `/rooms/${encodeURIComponent(normalized)}`
}

function houseTarget(slug: string): string {
  const normalized = slug.trim()
  if (!normalized || isFictionalAccommodationSlug(normalized)) return '/houses'
  return accommodationPath('sunny-park', normalized)
}

/** Old /gotel/:slug addresses. Fictional rooms go to the rooms list; real slugs keep a detail URL. */
export function legacyGotelTarget(slug: string): string {
  return roomTarget(slug)
}

/** Browser redirects for old and fictional catalog URLs. Null means the URL is already canonical. */
export function catalogRedirect(pathname: string): string | null {
  if (pathname === '/gotel' || pathname === '/hotel' || pathname === '/prozhivannya') return '/rooms'
  if (pathname === '/sunny-park') return '/houses'
  if (pathname.startsWith('/prozhivannya/')) return '/rooms'

  const legacyRoom = pathname.match(/^\/(?:gotel|hotel)\/([^/]+)\/?$/)
  if (legacyRoom) return roomTarget(decodeURIComponent(legacyRoom[1]))

  const legacyHouse = pathname.match(/^\/sunny-park\/([^/]+)\/?$/)
  if (legacyHouse) return houseTarget(decodeURIComponent(legacyHouse[1]))

  const rooms = pathname.match(/^\/rooms\/([^/]+)\/?$/)
  if (rooms && isFictionalAccommodationSlug(decodeURIComponent(rooms[1]))) return '/rooms'

  const houses = pathname.match(/^\/houses\/([^/]+)\/?$/)
  if (houses) {
    const slug = decodeURIComponent(houses[1])
    if (isFictionalAccommodationSlug(slug)) return '/houses'
    const canonical = houseTarget(slug)
    if (canonical !== `/houses/${encodeURIComponent(slug)}`) return canonical
  }

  return null
}

export function categoryFromPath(pathname: string): AccommodationCategory | null {
  if (pathname === '/rooms' || pathname.startsWith('/rooms/')) return 'rooms'
  if (pathname === '/houses' || pathname.startsWith('/houses/')) return 'houses'
  return null
}

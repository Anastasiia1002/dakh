import type { PublicHotelSlug } from '../publicBooking/types'

const FICTIONAL_SLUGS = new Set(['bukovyna', 'goryshche', 'plats'])

export function isFictionalAccommodationSlug(slug: string): boolean {
  return FICTIONAL_SLUGS.has(slug.trim().toLowerCase())
}

export function accommodationBase(hotel: PublicHotelSlug): '/hotel' | '/sunny-park' {
  return hotel === 'dakh' ? '/hotel' : '/sunny-park'
}

export function accommodationPath(hotel: PublicHotelSlug, slug?: string): string {
  const base = accommodationBase(hotel)
  if (!slug) return base
  return `${base}/${encodeURIComponent(slug.trim())}`
}

/** Old /gotel/:slug addresses. Fictional rooms go to the DAKH list; real slugs keep their detail URL. */
export function legacyGotelTarget(slug: string): string {
  const normalized = slug.trim()
  if (!normalized || isFictionalAccommodationSlug(normalized)) return '/hotel'
  return accommodationPath('dakh', normalized)
}

/** Fictional detail URLs never stay on a detail page. */
export function fictionalDetailRedirect(hotel: PublicHotelSlug, slug: string): string | null {
  return isFictionalAccommodationSlug(slug) ? accommodationBase(hotel) : null
}

/** Browser redirects for the old and fictional catalog URLs. Null means the URL is rendered as-is. */
export function catalogRedirect(pathname: string): string | null {
  if (pathname === '/gotel') return '/hotel'
  const legacy = pathname.match(/^\/gotel\/([^/]+)\/?$/)
  if (legacy) return legacyGotelTarget(decodeURIComponent(legacy[1]))

  const hotel = pathname.match(/^\/hotel\/([^/]+)\/?$/)
  if (hotel) return fictionalDetailRedirect('dakh', decodeURIComponent(hotel[1]))

  const sunny = pathname.match(/^\/sunny-park\/([^/]+)\/?$/)
  if (sunny) return fictionalDetailRedirect('sunny-park', decodeURIComponent(sunny[1]))

  if (pathname === '/prozhivannya' || pathname.startsWith('/prozhivannya/')) return '/hotel'
  return null
}

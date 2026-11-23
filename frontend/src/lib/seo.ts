import { site } from '../data/catalog'
import { publicSummary, publicTitle } from './catalog/display'

export type PublicSeoRoute = {
  path: string
  title: string
  description: string
  index: boolean
  image?: string
}

/** Published guest site. Canonical URLs and the sitemap point here. */
export const GITHUB_PAGES_ORIGIN = 'https://anastasiia1002.github.io'
export const GITHUB_PAGES_BASE = '/dakh/'
export const DEFAULT_SHARE_IMAGE = `${GITHUB_PAGES_ORIGIN}${GITHUB_PAGES_BASE}images/dakh-facade-night-1280.webp`

export const DEFAULT_SEO: PublicSeoRoute = {
  path: '/',
  title: 'DAKH — готель і ресторан у Мигові',
  description: 'Готель і ресторан DAKH у Мигові. Буковина на смак, дотик і спокій.',
  index: true,
}

export const PUBLIC_SEO_ROUTES: PublicSeoRoute[] = [
  DEFAULT_SEO,
  {
    path: '/rooms',
    title: 'Номери — DAKH Мигове',
    description: 'Номери готелю DAKH у Мигові. Оберіть дати, щоб перевірити доступність і вартість.',
    index: true,
  },
  {
    path: '/houses',
    title: 'Будиночки — DAKH Мигове',
    description: 'Окремі будиночки DAKH у Мигові. Оберіть дати, щоб перевірити доступність і вартість.',
    index: true,
  },
  {
    path: '/menu',
    title: 'Ресторан — DAKH Мигове',
    description: 'Ресторан DAKH у Мигові. Карпатська кухня й посилання на чинне меню.',
    index: true,
  },
  {
    path: '/pro-nas',
    title: 'Про нас — DAKH Мигове',
    description: 'DAKH — готель і ресторан у Мигові, де сучасний спокій зустрічається з духом Карпат.',
    index: true,
  },
  {
    path: '/kontakty',
    title: 'Контакти — DAKH Мигове',
    description: `${site.address}, ${site.city}. Телефон ${site.phones[0]}.`,
    index: true,
  },
  {
    path: '/bronuvannya',
    title: 'Бронювання — DAKH Мигове',
    description: 'Оберіть дати й кількість гостей. Суму бронювання підтверджує сервер.',
    index: true,
  },
]

export const NOINDEX_PATH_PREFIXES = ['/bronuvannya/pidtverdzhennya', '/moie-bronyuvannya', '/my-booking']

/** Strip trailing slashes so `/rooms/` matches the listing, not a room detail. */
export function normalizePublicPath(pathname: string) {
  if (!pathname) return '/'
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (withSlash === '/') return '/'
  return withSlash.replace(/\/+$/, '') || '/'
}

export function seoForPath(pathname: string): PublicSeoRoute {
  const path = normalizePublicPath(pathname)
  if (NOINDEX_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return {
      path,
      title: 'Підтвердження бронювання — DAKH',
      description: 'Сторінка підтвердження бронювання. Не для пошуку.',
      index: false,
    }
  }
  const exact = PUBLIC_SEO_ROUTES.find((route) => route.path === path)
  if (exact) return exact
  if (path.startsWith('/rooms/')) {
    return {
      path,
      title: 'Номер — DAKH Мигове',
      description: 'Деталі номера DAKH: місткість, фото й бронювання за датами.',
      index: true,
    }
  }
  if (path.startsWith('/houses/')) {
    return {
      path,
      title: 'Будиночок — DAKH Мигове',
      description: 'Деталі будиночка DAKH: місткість, фото й бронювання за датами.',
      index: true,
    }
  }
  return { ...DEFAULT_SEO, path }
}

export function seoForDetail(
  pathname: string,
  detail: { name: string; maxGuests: number; description: string; image?: string },
): PublicSeoRoute {
  const fallback = seoForPath(pathname)
  const summary = publicSummary(detail.description).replace(/\s+/g, ' ').trim()
  const image = detail.image?.startsWith('https://') ? detail.image : undefined
  return {
    ...fallback,
    title: `${publicTitle(detail.name, detail.maxGuests)} — DAKH Мигове`,
    description: summary.slice(0, 180) || fallback.description,
    image,
  }
}

/** HTTPS origin only. An empty or invalid value means “use the published site”. */
export function resolvePublicOrigin(raw?: string | null) {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return ''
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

export function publicSiteOrigin(raw = import.meta.env?.VITE_PUBLIC_SITE_ORIGIN) {
  return resolvePublicOrigin(raw) || GITHUB_PAGES_ORIGIN
}

/** GitHub Pages keeps `/dakh/`. Any other HTTPS origin uses the deployment base. */
export function canonicalBase(origin = publicSiteOrigin(), deploymentBase = import.meta.env?.BASE_URL ?? '/') {
  if (origin === GITHUB_PAGES_ORIGIN) return GITHUB_PAGES_BASE
  return deploymentBase.endsWith('/') ? deploymentBase : `${deploymentBase}/`
}

export function canonicalUrl(
  pathname: string,
  origin = publicSiteOrigin(),
  base = canonicalBase(origin),
) {
  if (!origin) return ''
  const path = normalizePublicPath(pathname)
  const root = origin.replace(/\/$/, '')
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  if (path === '/') return `${root}${prefix || ''}/`
  return `${root}${prefix}${path}`
}

export function sitemapLocations(paths: readonly string[], origin = publicSiteOrigin(), base = canonicalBase(origin)) {
  const locations = paths
    .filter((path) => seoForPath(path).index)
    .map((path) => canonicalUrl(path, origin, base))
    .filter(Boolean)
  return [...new Set(locations)]
}

export function hotelJsonLd(pageUrl = canonicalUrl('/')) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: site.hotel,
    description: DEFAULT_SEO.description,
    url: pageUrl,
    image: DEFAULT_SHARE_IMAGE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: 'UA',
    },
    telephone: site.phones[0],
    email: site.email,
    checkinTime: site.checkIn,
    checkoutTime: site.checkOut,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.map.lat,
      longitude: site.map.lng,
    },
  }
}

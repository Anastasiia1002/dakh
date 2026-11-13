import { site } from '../data/catalog'

export type PublicSeoRoute = {
  path: string
  title: string
  description: string
  index: boolean
}

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
    title: 'Кімнати — DAKH Мигове',
    description: 'Кімнати готелю DAKH у Мигові. Оберіть дати, щоб перевірити доступність і вартість.',
    index: true,
  },
  {
    path: '/houses',
    title: 'Будинки — DAKH Мигове',
    description: 'Окремі будинки DAKH у Мигові. Оберіть дати, щоб перевірити доступність і вартість.',
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
    description: 'Оберіть дати й кількість гостей. Суму бронювання підтверджує сервер. Оплату на сайті не приймаємо.',
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
      title: 'Кімната — DAKH Мигове',
      description: 'Деталі кімнати DAKH: місткість, фото й бронювання за датами.',
      index: true,
    }
  }
  if (path.startsWith('/houses/')) {
    return {
      path,
      title: 'Будинок — DAKH Мигове',
      description: 'Деталі будинку DAKH: місткість, фото й бронювання за датами.',
      index: true,
    }
  }
  return { ...DEFAULT_SEO, path }
}

export function publicSiteOrigin() {
  const raw = import.meta.env?.VITE_PUBLIC_SITE_ORIGIN?.trim() ?? ''
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return ''
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

export function canonicalUrl(pathname: string, origin = publicSiteOrigin(), base = import.meta.env?.BASE_URL ?? '/') {
  if (!origin) return ''
  const root = origin.replace(/\/$/, '')
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  if (pathname === '/') return `${root}${prefix || ''}/`
  return `${root}${prefix}${pathname}`
}

export function hotelJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: site.hotel,
    description: DEFAULT_SEO.description,
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

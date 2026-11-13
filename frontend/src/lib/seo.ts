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
    description: 'Кімнати готелю DAKH у Мигові. Порівняйте місткість і оберіть дати для бронювання.',
    index: true,
  },
  {
    path: '/houses',
    title: 'Будинки — DAKH Мигове',
    description: 'Окремі будинки поруч із DAKH. Місткість із каталогу, дати й сума — після вибору на сервері.',
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

export function seoForPath(pathname: string): PublicSeoRoute {
  if (NOINDEX_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return {
      path: pathname,
      title: 'Підтвердження бронювання — DAKH',
      description: 'Сторінка підтвердження бронювання. Не для пошуку.',
      index: false,
    }
  }
  const exact = PUBLIC_SEO_ROUTES.find((route) => route.path === pathname)
  if (exact) return exact
  if (pathname.startsWith('/rooms/')) {
    return {
      path: pathname,
      title: 'Кімната — DAKH Мигове',
      description: 'Деталі кімнати DAKH: місткість, фото й бронювання за датами.',
      index: true,
    }
  }
  if (pathname.startsWith('/houses/')) {
    return {
      path: pathname,
      title: 'Будинок — DAKH Мигове',
      description: 'Деталі будинку DAKH: місткість, фото й бронювання за датами.',
      index: true,
    }
  }
  return { ...DEFAULT_SEO, path: pathname }
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

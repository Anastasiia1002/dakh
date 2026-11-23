import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { toPublicAccommodationSlug, type AccommodationCategory } from '../src/lib/catalog/categories.ts'
import { knownDetailPaths } from '../src/lib/catalog/publicSlugs.ts'
import { catalogCoverPreload, heroPreload, listingHeroPreload } from '../src/lib/localPhoto.ts'
import {
  DEFAULT_SHARE_IMAGE,
  GITHUB_PAGES_ORIGIN,
  PUBLIC_SEO_ROUTES,
  canonicalBase,
  canonicalUrl,
  hotelJsonLd,
  resolvePublicOrigin,
  seoForDetail,
  seoForPath,
  sitemapLocations,
  type PublicSeoRoute,
} from '../src/lib/seo.ts'
import { resolveSiteBase } from '../src/lib/siteBase.ts'
import type { PublicAccommodation } from '../src/lib/publicBooking/types.ts'

const dist = 'dist'
const index = readFileSync(join(dist, 'index.html'), 'utf8')
const origin = resolvePublicOrigin(process.env.VITE_PUBLIC_SITE_ORIGIN) || GITHUB_PAGES_ORIGIN
const deploymentBase = resolveSiteBase({
  DAKH_SITE_BASE: process.env.DAKH_SITE_BASE,
  VERCEL: process.env.VERCEL,
})
const shareBase = canonicalBase(origin, deploymentBase)
const apiBase = (process.env.VITE_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '')
const hotelMap = process.env.VITE_ACCOMMODATION_HOTEL_MAP

type CoverFiles = { publicSlug: string }

function applySeo(
  html: string,
  pathname: string,
  options: {
    seo?: PublicSeoRoute
    cover?: CoverFiles
  } = {},
) {
  const seo = options.seo ?? seoForPath(pathname)
  const robots = seo.index ? 'index,follow' : 'noindex,nofollow'
  const image = seo.image?.startsWith('https://') ? seo.image : DEFAULT_SHARE_IMAGE
  const canonical = canonicalUrl(pathname, origin, shareBase)
  let next = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`)
    .replace(/content="Готель і ресторан DAKH у Мигові\. Буковина на смак, дотик і спокій\."/g, `content="${escapeHtml(seo.description)}"`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`)
    .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`)
  if (!next.includes('rel="canonical"')) {
    next = next.replace('</title>', `</title>\n    <link rel="canonical" href="${canonical}" />`)
  }
  next = next.replace(
    '</head>',
    `    <meta property="og:url" content="${canonical}" />\n    <meta name="robots" content="${robots}" />\n  </head>`,
  )
  const jsonLd = JSON.stringify(hotelJsonLd(canonicalUrl('/', origin, shareBase))).replace(/</g, '\\u003c')
  if (next.includes('id="dakh-hotel-jsonld"')) {
    next = next.replace(/<script id="dakh-hotel-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="dakh-hotel-jsonld" type="application/ld+json">${jsonLd}</script>`)
  } else {
    next = next.replace('</head>', `    <script id="dakh-hotel-jsonld" type="application/ld+json">${jsonLd}</script>\n  </head>`)
  }
  if (pathname === '/') {
    const preload = heroPreload(deploymentBase)
    const tag = `    <link rel="preload" as="image" type="image/webp" href="${preload.href}" imagesrcset="${preload.imagesrcset}" imagesizes="${preload.imagesizes}" fetchpriority="high" />\n`
    if (!next.includes(preload.href)) {
      next = next.replace('</title>', `</title>\n${tag}`)
    }
  }
  if (pathname === '/bronuvannya') {
    const preload = listingHeroPreload('rooms', deploymentBase)
    const tag = `    <link rel="preload" as="image" type="image/webp" href="${preload.href}" imagesrcset="${preload.imagesrcset}" imagesizes="${preload.imagesizes}" fetchpriority="high" />\n`
    if (!next.includes(preload.href)) {
      next = next.replace('</title>', `</title>\n${tag}`)
    }
    const bookingChunk = findChunk('BookingFlow-')
    if (bookingChunk && !next.includes(bookingChunk)) {
      next = next.replace(
        '</title>',
        `</title>\n    <link rel="modulepreload" crossorigin href="${deploymentBase}assets/${bookingChunk}" />\n`,
      )
    }
  }
  if (pathname === '/rooms' || pathname === '/houses') {
    const preload = listingHeroPreload(pathname === '/houses' ? 'houses' : 'rooms', deploymentBase)
    const tag = `    <link rel="preload" as="image" type="image/webp" href="${preload.href}" imagesrcset="${preload.imagesrcset}" imagesizes="${preload.imagesizes}" fetchpriority="high" />\n`
    if (!next.includes(preload.href)) {
      next = next.replace('</title>', `</title>\n${tag}`)
    }
    const hotelChunk = findChunk('HotelPage-')
    if (hotelChunk && !next.includes(hotelChunk)) {
      next = next.replace(
        '</title>',
        `</title>\n    <link rel="modulepreload" crossorigin href="${deploymentBase}assets/${hotelChunk}" />\n`,
      )
    }
  }
  if (options.cover) {
    const preload = catalogCoverPreload(options.cover.publicSlug, deploymentBase)
    const tag = `    <link rel="preload" as="image" type="image/webp" href="${preload.href}" imagesrcset="${preload.imagesrcset}" imagesizes="${preload.imagesizes}" fetchpriority="high" />\n`
    if (!next.includes(preload.href)) {
      next = next.replace('</title>', `</title>\n${tag}`)
    }
    const roomChunk = findChunk('RoomPage-')
    if (roomChunk && !next.includes(roomChunk)) {
      next = next.replace(
        '</title>',
        `</title>\n    <link rel="modulepreload" crossorigin href="${deploymentBase}assets/${roomChunk}" />\n`,
      )
    }
    if (!next.includes('photos.bookmenow.pro')) {
      next = next.replace(
        '</title>',
        `</title>\n    <link rel="preconnect" href="https://photos.bookmenow.pro" crossorigin />\n`,
      )
    }
    next = next.replace(
      '<div id="root"></div>',
      `<img id="dakh-lcp-cover" class="dakh-lcp-cover" src="${preload.href}" srcset="${preload.imagesrcset}" sizes="${preload.imagesizes}" alt="" width="800" height="1067" fetchpriority="high" decoding="async" />\n    <div id="root"></div>`,
    )
    if (!next.includes('.dakh-lcp-cover')) {
      next = next.replace(
        '</head>',
        `    <style>
      .dakh-lcp-cover { position: absolute; inset: 0 auto auto 0; z-index: 0; width: 100%; height: 42svh; object-fit: cover; pointer-events: none; }
      @media (min-width: 768px) { .dakh-lcp-cover { height: 56vh; } }
      body:has(#root article) .dakh-lcp-cover { visibility: hidden; }
    </style>\n  </head>`,
      )
    }
  }
  return next
}

function findChunk(prefix: string) {
  return readdirSync(join(dist, 'assets')).find((name) => name.startsWith(prefix) && name.endsWith('.js'))
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function writeRoute(pathname: string, html: string) {
  if (pathname === '/') {
    writeFileSync(join(dist, 'index.html'), html)
    return
  }
  const file = join(dist, pathname.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

for (const route of PUBLIC_SEO_ROUTES) {
  writeRoute(route.path, applySeo(index, route.path))
}

const catalog = await loadCatalog()
const writtenCovers = new Set<string>()

for (const path of detailPaths(catalog)) {
  const item = catalog.get(path)
  const publicSlug = path.split('/').at(-1) ?? ''
  let cover: CoverFiles | undefined
  if (item?.cover) {
    const prepared = await writeCoverVariants(publicSlug, item.cover.url)
    if (prepared) {
      cover = { publicSlug }
      writtenCovers.add(publicSlug)
    }
  }
  const seo = item
    ? seoForDetail(path, { ...item, image: item.cover?.url })
    : seoForPath(path)
  writeRoute(path, applySeo(index, path, { seo, cover }))
}

const sitemapPaths = [...PUBLIC_SEO_ROUTES.map((route) => route.path), ...detailPaths(catalog)]
const urls = sitemapLocations(sitemapPaths, origin, shareBase).map((loc) => `  <url><loc>${loc}</loc></url>`)
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)

console.log(
  `Wrote public HTML shells for indexable routes and ${knownDetailPaths().length} detail pages (${writtenCovers.size} sized covers)`,
)

function detailPaths(items: Map<string, PublicAccommodation>) {
  const paths = new Set(knownDetailPaths())
  for (const path of items.keys()) paths.add(path)
  return [...paths]
}

async function loadCatalog() {
  const items = new Map<string, PublicAccommodation>()
  if (!apiBase.startsWith('https://')) {
    console.warn('write-public-html: skipping catalog fetch (no https API)')
    return items
  }
  const hotels = hotelMap === 'split' ? (['dakh', 'sunny-park'] as const) : (['dakh'] as const)
  for (const hotel of hotels) {
    try {
      const response = await fetch(`${apiBase}/hotels/${hotel}/accommodations`, {
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) {
        console.warn(`write-public-html: catalog ${hotel} HTTP ${response.status}`)
        continue
      }
      const payload = (await response.json()) as { accommodations?: PublicAccommodation[] }
      for (const item of payload.accommodations ?? []) {
        const category: AccommodationCategory = item.kind === 'COTTAGE' ? 'houses' : 'rooms'
        const path = `${category === 'rooms' ? '/rooms' : '/houses'}/${toPublicAccommodationSlug(category, item.slug)}`
        items.set(path, item)
      }
    } catch (error) {
      console.warn(`write-public-html: catalog ${hotel} failed`, error)
    }
  }
  return items
}

async function writeCoverVariants(publicSlug: string, url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!response.ok) return false
    const source = Buffer.from(await response.arrayBuffer())
    const dir = join(dist, 'images', 'covers')
    mkdirSync(dir, { recursive: true })
    const widths = [800, 1280, 1920] as const
    let encoded = false
    try {
      const sharp = (await import('sharp')).default
      await Promise.all(
        widths.map((width) =>
          sharp(source)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toFile(join(dir, `${publicSlug}-${width}.webp`)),
        ),
      )
      encoded = true
    } catch {
      for (const width of widths) {
        writeFileSync(join(dir, `${publicSlug}-${width}.webp`), source)
      }
    }
    return encoded || source.length > 0
  } catch (error) {
    console.warn(`write-public-html: cover ${publicSlug} failed`, error)
    return false
  }
}

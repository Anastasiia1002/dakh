import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PUBLIC_SEO_ROUTES, seoForPath } from '../src/lib/seo.ts'
import { resolveSiteBase } from '../src/lib/siteBase.ts'

const dist = 'dist'
const index = readFileSync(join(dist, 'index.html'), 'utf8')
const origin = (process.env.VITE_PUBLIC_SITE_ORIGIN ?? '').replace(/\/$/, '')
const base = resolveSiteBase({
  DAKH_SITE_BASE: process.env.DAKH_SITE_BASE,
  VERCEL: process.env.VERCEL,
})

function applySeo(html: string, pathname: string) {
  const seo = seoForPath(pathname)
  const robots = seo.index ? 'index,follow' : 'noindex,nofollow'
  let next = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/content="Готель і ресторан DAKH у Мигові\. Буковина на смак, дотик і спокій\."/g, `content="${escapeHtml(seo.description)}"`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`)
  if (origin) {
    const canonical = pathname === '/' ? `${origin}${base}` : `${origin}${base.replace(/\/$/, '')}${pathname}`
    if (!next.includes('rel="canonical"')) {
      next = next.replace('</title>', `</title>\n    <link rel="canonical" href="${canonical}" />`)
    }
    next = next.replace('</head>', `    <meta property="og:url" content="${canonical}" />\n    <meta name="robots" content="${robots}" />\n  </head>`)
  } else {
    next = next.replace('</head>', `    <meta name="robots" content="${robots}" />\n  </head>`)
  }
  return next
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

for (const route of PUBLIC_SEO_ROUTES) {
  const html = applySeo(index, route.path)
  if (route.path === '/') {
    writeFileSync(join(dist, 'index.html'), html)
    continue
  }
  const file = join(dist, route.path.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

if (origin) {
  const urls = PUBLIC_SEO_ROUTES.filter((route) => route.index).map((route) => {
    const loc = route.path === '/' ? `${origin}${base}` : `${origin}${base.replace(/\/$/, '')}${route.path}`
    return `  <url><loc>${loc}</loc></url>`
  })
  writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
  )
}

console.log('Wrote public HTML shells for indexable routes')

import { copyFileSync } from 'node:fs'
import { resolveSiteBase } from '../src/lib/siteBase.ts'

const base = resolveSiteBase({
  DAKH_SITE_BASE: process.env.DAKH_SITE_BASE,
  VERCEL: process.env.VERCEL,
})

if (base === '/') {
  process.exit(0)
}

copyFileSync('dist/index.html', 'dist/404.html')

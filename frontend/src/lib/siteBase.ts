const PAGES_BASE = '/dakh/'
const SEGMENT = /^[a-z0-9-]+$/

export type SiteBaseEnv = {
  /** Explicit build-time base. Wins over the Vercel signal. Not a hostname. */
  DAKH_SITE_BASE?: string
  /** Set by Vercel during its build. Not read in the browser. */
  VERCEL?: string
}

/** `/` or one slash-wrapped segment such as `/dakh/`. */
export function normalizeSiteBase(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '/') return '/'
  const segment = trimmed.replace(/^\/+|\/+$/g, '')
  if (!SEGMENT.test(segment)) {
    throw new Error('DAKH_SITE_BASE must be / or one path segment such as /dakh/.')
  }
  return `/${segment}/`
}

/**
 * Build-time site root.
 * An explicit DAKH_SITE_BASE wins. Otherwise a Vercel build uses `/`,
 * and every other build keeps the GitHub Pages base `/dakh/`.
 */
export function resolveSiteBase(env: SiteBaseEnv): string {
  const explicit = env.DAKH_SITE_BASE?.trim()
  if (explicit) return normalizeSiteBase(explicit)
  if (env.VERCEL === '1') return '/'
  return PAGES_BASE
}

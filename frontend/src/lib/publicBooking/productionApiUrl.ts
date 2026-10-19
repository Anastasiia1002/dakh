const PUBLIC_PREFIX = '/api/public/v1'

/** Local Nest process used by the older loopback helper. */
export const STAGING_PUBLIC_API_BASE_URL = 'http://localhost:3000/api/public/v1'

/** Disposable public QA API. Staging builds and local booking writes may use this origin. */
export const STAGING_QA_PUBLIC_API_BASE_URL = 'http://127.0.0.1:3001/api/public/v1'

const LOOPBACK_API_PORTS = new Set(['3000', '3001'])

function trimSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function resolvePublicApiBaseUrlFromValues(env: {
  VITE_PUBLIC_API_BASE_URL?: string
  VITE_API_BASE_URL?: string
}): string | null {
  const explicit = env.VITE_PUBLIC_API_BASE_URL?.trim()
  if (explicit) return trimSlash(explicit)

  const origin = env.VITE_API_BASE_URL?.trim()
  if (!origin) return null

  const normalized = trimSlash(origin)
  if (normalized.endsWith(PUBLIC_PREFIX)) return normalized
  return `${normalized}${PUBLIC_PREFIX}`
}

/**
 * Production builds must target an HTTPS API. Local `vite` dev is unchanged.
 * Returns a message when the resolved URL cannot be published.
 */
export function productionApiBaseUrlError(url: string | null): string | null {
  if (!url) {
    return 'VITE_PUBLIC_API_BASE_URL is required for a production build and must end with /api/public/v1.'
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'VITE_PUBLIC_API_BASE_URL must be an absolute URL.'
  }
  if (parsed.username || parsed.password) {
    return 'VITE_PUBLIC_API_BASE_URL must not contain credentials.'
  }
  if (parsed.protocol !== 'https:') {
    return 'VITE_PUBLIC_API_BASE_URL must use https for a production build.'
  }
  const host = parsed.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    return 'VITE_PUBLIC_API_BASE_URL must not point at localhost for a production build.'
  }
  if (parsed.pathname.replace(/\/+$/, '') !== '/api/public/v1') {
    return 'VITE_PUBLIC_API_BASE_URL must end with /api/public/v1.'
  }
  return null
}

/** Staging writes stay on the local API. Any other host is not a silent localhost fallback. */
export function isLoopbackPublicApi(url: string | null): boolean {
  if (!url) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const host = parsed.hostname.toLowerCase()
  if (host !== 'localhost' && host !== '127.0.0.1') return false
  if (parsed.protocol !== 'http:' || !LOOPBACK_API_PORTS.has(parsed.port)) return false
  if (parsed.username || parsed.password) return false
  return parsed.pathname.replace(/\/+$/, '') === PUBLIC_PREFIX
}

export const PRODUCTION_RENDER_API_HOST = 'dakh-backend.onrender.com'

export function isProductionRenderPublicApi(url: string | null): boolean {
  if (!url) return false
  try {
    return new URL(url).hostname.toLowerCase() === PRODUCTION_RENDER_API_HOST
  } catch {
    return false
  }
}

/** HTTPS staging client API. Never the production Render host, never localhost. */
export function deployedStagingApiBaseUrlError(url: string | null): string | null {
  const error = productionApiBaseUrlError(url)
  if (error) return error
  if (isProductionRenderPublicApi(url)) {
    return 'A staging client must not use the production Render API.'
  }
  return null
}

/** Local loopback QA or a dedicated HTTPS staging API. Not production Render. */
export function stagingApiBaseUrlError(url: string | null): string | null {
  if (url === STAGING_QA_PUBLIC_API_BASE_URL || url === 'http://localhost:3001/api/public/v1') return null
  return deployedStagingApiBaseUrlError(url)
}

/**
 * Loopback is always a safe write target.
 * A remote HTTPS API is a write target only for an explicit production build.
 * An invalid or missing production URL does not fall back to localhost.
 */
export function bookingTargetAllowsWrites(url: string | null, allowRemoteWrites: boolean): boolean {
  if (isLoopbackPublicApi(url)) return true
  if (!allowRemoteWrites || !url) return false
  if (isProductionRenderPublicApi(url)) {
    return productionApiBaseUrlError(url) === null
  }
  return deployedStagingApiBaseUrlError(url) === null
}

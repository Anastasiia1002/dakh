const PUBLIC_PREFIX = '/api/public/v1'

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

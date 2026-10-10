const PUBLIC_PREFIX = '/api/public/v1'

function trimSlash(value: string) {
  return value.replace(/\/+$/, '')
}

/**
 * Public API origin + prefix.
 * Prefers VITE_PUBLIC_API_BASE_URL (full `/api/public/v1` URL from the spec).
 * Also accepts VITE_API_BASE_URL as a host (`http://localhost:3000`) or a full prefix.
 */
const emptyEnv: Pick<ImportMetaEnv, 'VITE_PUBLIC_API_BASE_URL' | 'VITE_API_BASE_URL' | 'VITE_PUBLIC_HOTEL_SLUG' | 'VITE_PUBLIC_RATE_PLAN_ID'> =
  {}

function readEnv() {
  return import.meta.env ?? emptyEnv
}

export function resolvePublicApiBaseUrl(
  env: Pick<ImportMetaEnv, 'VITE_PUBLIC_API_BASE_URL' | 'VITE_API_BASE_URL'> = readEnv(),
): string | null {
  const explicit = env.VITE_PUBLIC_API_BASE_URL?.trim()
  if (explicit) return trimSlash(explicit)

  const origin = env.VITE_API_BASE_URL?.trim()
  if (!origin) return null

  const normalized = trimSlash(origin)
  if (normalized.endsWith(PUBLIC_PREFIX)) return normalized
  return `${normalized}${PUBLIC_PREFIX}`
}

export function resolveHotelSlug(env: Pick<ImportMetaEnv, 'VITE_PUBLIC_HOTEL_SLUG'> = readEnv()): string {
  const slug = env.VITE_PUBLIC_HOTEL_SLUG?.trim().toLowerCase()
  return slug || 'dakh'
}

/**
 * Optional until CRM creates an active public rate plan. Never invent a UUID.
 * Public availability does not return ratePlanId; the documented API has no
 * list/discover-rate-plans route. Quotes still require a UUID from env/CRM.
 */
export function resolveRatePlanId(
  env: Pick<ImportMetaEnv, 'VITE_PUBLIC_RATE_PLAN_ID'> = readEnv(),
): string | null {
  const id = env.VITE_PUBLIC_RATE_PLAN_ID?.trim()
  return id || null
}

export function isPublicApiConfigured(
  env: Pick<ImportMetaEnv, 'VITE_PUBLIC_API_BASE_URL' | 'VITE_API_BASE_URL'> = readEnv(),
): boolean {
  return Boolean(resolvePublicApiBaseUrl(env))
}

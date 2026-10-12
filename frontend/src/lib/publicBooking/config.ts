import { parseRoomSlugMap } from './roomIdentity'
import { productionApiBaseUrlError, resolvePublicApiBaseUrlFromValues } from './productionApiUrl'

export { productionApiBaseUrlError }

/**
 * Public API origin + prefix.
 * Prefers VITE_PUBLIC_API_BASE_URL (full `/api/public/v1` URL from the spec).
 * Also accepts VITE_API_BASE_URL as a host (`http://localhost:3000`) or a full prefix.
 */
const emptyEnv: Pick<
  ImportMetaEnv,
  'VITE_PUBLIC_API_BASE_URL' | 'VITE_API_BASE_URL' | 'VITE_PUBLIC_HOTEL_SLUG' | 'VITE_PUBLIC_ROOM_SLUG_MAP'
> = {}

function readEnv() {
  return import.meta.env ?? emptyEnv
}

export function resolvePublicApiBaseUrl(
  env: Pick<ImportMetaEnv, 'VITE_PUBLIC_API_BASE_URL' | 'VITE_API_BASE_URL'> = readEnv(),
): string | null {
  return resolvePublicApiBaseUrlFromValues(env)
}

export function resolveHotelSlug(env: Pick<ImportMetaEnv, 'VITE_PUBLIC_HOTEL_SLUG'> = readEnv()): string {
  const slug = env.VITE_PUBLIC_HOTEL_SLUG?.trim().toLowerCase()
  return slug || 'dakh'
}

export function isPublicApiConfigured(
  env: Pick<ImportMetaEnv, 'VITE_PUBLIC_API_BASE_URL' | 'VITE_API_BASE_URL'> = readEnv(),
): boolean {
  return Boolean(resolvePublicApiBaseUrl(env))
}

export function readRoomSlugMap(
  env: Pick<ImportMetaEnv, 'VITE_PUBLIC_ROOM_SLUG_MAP'> = readEnv(),
) {
  return parseRoomSlugMap(env.VITE_PUBLIC_ROOM_SLUG_MAP)
}

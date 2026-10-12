import type { PublicCalendarRoomType } from './types'

/** Two months need this much horizontal room. Narrower popovers stay on one month. */
export const TWO_MONTH_MIN_PX = 736

export function calendarUsesTwoMonths(containerWidth: number) {
  return containerWidth >= TWO_MONTH_MIN_PX
}

/**
 * Explicit catalog-page slug → room-type slug pairs.
 * `bukovyna=e2e-bukovyna,goryshche=e2e-goryshche`
 * Unlisted pages keep their own slug. Nothing is inferred from names.
 */
export function parseRoomSlugMap(raw: string | undefined): ReadonlyMap<string, string> {
  const map = new Map<string, string>()
  if (!raw) return map
  for (const pair of raw.split(',')) {
    const [catalog, roomType] = pair.split('=').map((part) => part.trim().toLowerCase())
    if (!catalog || !roomType || catalog.includes(' ') || roomType.includes(' ')) continue
    if (map.has(catalog)) continue
    map.set(catalog, roomType)
  }
  return map
}

export function resolveRoomTypeSlug(catalogSlug: string, map: ReadonlyMap<string, string>) {
  const catalog = catalogSlug.trim().toLowerCase()
  return map.get(catalog) ?? catalog
}

export function findRoomTypeBySlug(
  roomTypes: readonly Pick<PublicCalendarRoomType, 'roomTypeId' | 'slug' | 'name'>[],
  expectedSlug: string,
) {
  const slug = expectedSlug.trim().toLowerCase()
  if (!slug) return null
  const matches = roomTypes.filter((room) => room.slug.trim().toLowerCase() === slug)
  if (matches.length !== 1) return null
  return matches[0] ?? null
}

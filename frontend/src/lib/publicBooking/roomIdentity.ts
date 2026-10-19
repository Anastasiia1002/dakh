import type { PublicCalendarRoomType } from './types'

/** Two months need this much horizontal room. Narrower popovers stay on one month. */
export const TWO_MONTH_MIN_PX = 736

export function calendarUsesTwoMonths(containerWidth: number) {
  return containerWidth >= TWO_MONTH_MIN_PX
}

/** Popover width that stays inside the viewport. One month until there is room for two. */
export function calendarPopoverWidth(viewportWidth: number, anchorWidth: number, align: 'start' | 'end' = 'start') {
  const margin = 12
  const maxWidth = Math.max(0, viewportWidth - margin * 2)
  const preferWide = align === 'end' && viewportWidth >= 768
  const preferred = preferWide
    ? Math.min(800, maxWidth)
    : Math.min(Math.max(anchorWidth, viewportWidth < 768 ? 360 : 280), maxWidth)
  return Math.min(preferred, maxWidth)
}

/** Width of one day cell after the popover padding. Used to keep 320px and 390px from overflowing. */
export function calendarDaySlot(viewportWidth: number, anchorWidth = 280) {
  const padding = viewportWidth >= 640 ? 20 : 12
  return (calendarPopoverWidth(viewportWidth, anchorWidth, 'end') - padding * 2) / 7
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

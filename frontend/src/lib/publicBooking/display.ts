import { resolveRoomTypeSlug } from './roomIdentity'
import { rateTypeLabel, roomKindLabel } from './stay'
import type { PublicRateType, PublicRoomKind } from './types'

export function isFixtureLabel(name: string) {
  return /^e2e(?:\s|$)/i.test(name.trim())
}

/** Staging and fixture inventory names are not visitor-facing copy. */
export function isHiddenInventoryLabel(name: string) {
  const trimmed = name.trim()
  return isFixtureLabel(trimmed) || /^test data(?:\s|$)/i.test(trimmed)
}

export function catalogNameForRoomTypeSlug(
  roomTypeSlug: string,
  catalog: readonly { slug: string; name: string }[],
  map: ReadonlyMap<string, string>,
) {
  const slug = roomTypeSlug.trim().toLowerCase()
  if (!slug) return null
  const matches = catalog.filter((stay) => resolveRoomTypeSlug(stay.slug, map) === slug)
  return matches.length === 1 ? (matches[0]?.name ?? null) : null
}

export function publicRoomLabel(apiName: string, kind: PublicRoomKind, verifiedCatalogName?: string | null) {
  if (verifiedCatalogName) return verifiedCatalogName
  if (isHiddenInventoryLabel(apiName)) return roomKindLabel(kind)
  return apiName
}

export function publicPlanTitle(plan: { name: string; type: PublicRateType }) {
  if (isHiddenInventoryLabel(plan.name)) return rateTypeLabel(plan.type)
  return plan.name
}

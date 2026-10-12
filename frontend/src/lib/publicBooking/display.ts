import { resolveRoomTypeSlug } from './roomIdentity'
import { rateTypeLabel, roomKindLabel } from './stay'
import type { PublicRateType, PublicRoomKind } from './types'

export function isFixtureLabel(name: string) {
  return /^e2e(?:\s|$)/i.test(name.trim())
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
  if (isFixtureLabel(apiName)) return roomKindLabel(kind)
  return apiName
}

export function publicPlanTitle(plan: { name: string; type: PublicRateType }) {
  if (isFixtureLabel(plan.name)) return rateTypeLabel(plan.type)
  return plan.name
}

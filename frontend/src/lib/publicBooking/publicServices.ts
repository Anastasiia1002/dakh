import type { PublicQuoteServiceLine, PublicServiceCatalogItem, PublicServiceSelection } from './types'

export const SERVICE_SECTION_HEADING = 'Додайте до проживання'

export const SERVICE_CHARGE_UNIT: Record<PublicServiceCatalogItem['chargeBasis'], string> = {
  PER_STAY: 'за бронювання',
  PER_NIGHT: 'за ніч',
}

const QUANTITY_CAP = 99

export function guestPicksServiceQuantity(item: Pick<PublicServiceCatalogItem, 'chargeBasis'>) {
  return item.chargeBasis === 'PER_STAY'
}

export function serviceQuantityBounds(
  item: Pick<PublicServiceCatalogItem, 'chargeBasis' | 'minQuantity' | 'maxQuantity'>,
) {
  if (!guestPicksServiceQuantity(item)) return { min: 1, max: 1 }
  const min = clampQuantity(item.minQuantity ?? 1)
  const max = Math.max(min, clampQuantity(item.maxQuantity ?? QUANTITY_CAP))
  return { min, max }
}

export function serviceSelectionKey(lines: readonly Pick<PublicServiceSelection, 'serviceId' | 'quantity'>[] | undefined) {
  return canonicalServiceSelection(lines)
    .map((line) => `${line.serviceId}:${line.quantity}`)
    .join('|')
}

export function canonicalServiceSelection(
  lines: readonly Pick<PublicServiceSelection, 'serviceId' | 'quantity'>[] | undefined,
): PublicServiceSelection[] {
  const byId = new Map<string, number>()
  for (const line of lines ?? []) {
    if (!line.serviceId || !Number.isInteger(line.quantity) || line.quantity < 1) continue
    byId.set(line.serviceId, line.quantity)
  }
  return [...byId.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([serviceId, quantity]) => ({ serviceId, quantity }))
}

/** Lines the guest selected, clamped to the current catalog. Empty means a stay without extras. */
export function selectedServiceLines(
  quantities: Readonly<Record<string, number>>,
  catalog: readonly PublicServiceCatalogItem[],
  stayNights?: number,
): PublicServiceSelection[] {
  const lines: PublicServiceSelection[] = []
  for (const item of catalog) {
    const chosen = quantities[item.id]
    if (chosen == null) continue
    if (!guestPicksServiceQuantity(item)) {
      if (!Number.isInteger(stayNights) || (stayNights ?? 0) < 1) continue
      lines.push({ serviceId: item.id, quantity: stayNights as number })
      continue
    }
    const { min, max } = serviceQuantityBounds(item)
    lines.push({ serviceId: item.id, quantity: Math.min(max, Math.max(min, chosen)) })
  }
  return canonicalServiceSelection(lines)
}

export function quoteServiceSelection(
  quote: { services?: readonly Pick<PublicQuoteServiceLine, 'serviceId' | 'quantity'>[] },
): PublicServiceSelection[] | undefined {
  const lines = canonicalServiceSelection(quote.services)
  return lines.length > 0 ? lines : undefined
}

function clampQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1) return 1
  return Math.min(QUANTITY_CAP, value)
}

import type { PublicOnlinePricing, PublicQuoteServiceLine, PublicServiceCatalogItem, PublicServiceSelection } from './types'

export const SERVICE_SECTION_HEADING = 'Додаткові послуги'
export const SERVICE_SECTION_HINT =
  'Необов’язково. Платні послуги з’являться в підсумку. Заявки з оплатою за домовленістю — окремо, без суми.'
export const SERVICE_LOADING_COPY = 'Завантажуємо послуги…'
export const SERVICE_EMPTY_COPY = 'Зараз немає послуг, які можна додати. Проживання можна оформити без них.'
export const SERVICE_ERROR_COPY = 'Послуги зараз не вдалося показати. Проживання можна оформити без них.'
export const SERVICE_DROPPED_COPY = 'Деякі послуги більше недоступні і зняті з заявки.'
export const SERVICE_AGREED_PRICE_COPY = 'Оплата за домовленістю'
export const SERVICE_AGREED_TOTAL_NOTE = 'Заявки з оплатою за домовленістю не входять у показану суму.'
export const SERVICE_REQUEST_HINT =
  'Побажання можна написати в коментарі нижче. Це заявка, не підтверджене бронювання послуги.'
export const SERVICE_QUANTITY_LABEL = 'Кількість'
export const SERVICE_QUANTITY_UNIT = 'грн / шт.'
export const SERVICE_FIXED_UNIT = 'фіксована ціна'
export const SERVICE_NIGHT_UNIT = 'грн / ніч'

const QUANTITY_CAP = 99

export function onlinePricingOf(item: Pick<PublicServiceCatalogItem, 'onlinePricing' | 'chargeBasis' | 'price'>): PublicOnlinePricing {
  return item.onlinePricing
}

export function guestPicksServiceQuantity(item: Pick<PublicServiceCatalogItem, 'onlinePricing' | 'chargeBasis' | 'price'>) {
  return onlinePricingOf(item) === 'GUEST_QUANTITY'
}

export function serviceUnitCopy(item: Pick<PublicServiceCatalogItem, 'onlinePricing' | 'chargeBasis' | 'price'>) {
  const mode = onlinePricingOf(item)
  if (mode === 'REQUEST_ONLY') return SERVICE_AGREED_PRICE_COPY
  if (mode === 'PER_NIGHT') return SERVICE_NIGHT_UNIT
  if (mode === 'FIXED_ONCE') return SERVICE_FIXED_UNIT
  if (mode === 'GUEST_QUANTITY') return SERVICE_QUANTITY_UNIT
  return SERVICE_FIXED_UNIT
}

export function serviceQuantityLabel(item: Pick<PublicServiceCatalogItem, 'chargeBasis' | 'onlinePricing' | 'price'>) {
  return guestPicksServiceQuantity(item) ? SERVICE_QUANTITY_LABEL : null
}

export function serviceQuantityBounds(
  item: Pick<PublicServiceCatalogItem, 'onlinePricing' | 'chargeBasis' | 'price' | 'minQuantity' | 'maxQuantity'>,
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
    const mode = onlinePricingOf(item)
    if (mode === 'PER_NIGHT') {
      if (!Number.isInteger(stayNights) || (stayNights ?? 0) < 1) continue
      lines.push({ serviceId: item.id, quantity: stayNights as number })
      continue
    }
    if (mode === 'REQUEST_ONLY') {
      lines.push({ serviceId: item.id, quantity: 1 })
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

export function isAgreedPriceLine(line: Pick<PublicQuoteServiceLine, 'pricing' | 'totalPrice'>) {
  return line.pricing === 'BY_AGREEMENT' || line.totalPrice == null
}

const SERVICE_SELECTION_STORAGE_KEY = 'dakh-booking-service-quantities'

export function loadStoredServiceQuantities(): Record<string, number> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(SERVICE_SELECTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const next: Record<string, number> = {}
    for (const [id, quantity] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1) next[id] = quantity
    }
    return next
  } catch {
    return {}
  }
}

export function persistServiceQuantities(quantities: Readonly<Record<string, number>>) {
  if (typeof sessionStorage === 'undefined') return
  try {
    if (Object.keys(quantities).length === 0) sessionStorage.removeItem(SERVICE_SELECTION_STORAGE_KEY)
    else sessionStorage.setItem(SERVICE_SELECTION_STORAGE_KEY, JSON.stringify(quantities))
  } catch {
    /* ignore quota / private mode */
  }
}

function clampQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1) return 1
  return Math.min(QUANTITY_CAP, value)
}

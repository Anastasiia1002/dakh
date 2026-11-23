import type { PublicOnlinePricing, PublicQuoteServiceLine, PublicServiceCatalogItem, PublicServiceSelection } from './types'

export const SERVICE_SECTION_HEADING = 'Додаткові послуги'
export const SERVICE_SECTION_HINT =
  'Необов’язково. Платні послуги з’являться в підсумку. Заявки з оплатою за домовленістю — окремо, без суми.'
export const SERVICE_LOADING_COPY = 'Завантажуємо послуги…'
export const SERVICE_EMPTY_COPY = 'Зараз немає послуг, які можна додати. Проживання можна оформити без них.'
export const SERVICE_ERROR_COPY = 'Послуги зараз не вдалося показати. Проживання можна оформити без них.'
export const SERVICE_DROPPED_COPY = 'Деякі послуги більше недоступні і зняті з заявки.'
export const SERVICE_AGREED_PRICE_COPY = 'Оплата за домовленістю'
export const SERVICE_FREE_COPY = 'Безкоштовно'
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

export function isFreePriceLine(line: Pick<PublicQuoteServiceLine, 'pricing' | 'totalPrice'>) {
  if (isAgreedPriceLine(line)) return false
  return typeof line.totalPrice === 'string' && /^0+(?:\.0+)?$/.test(line.totalPrice)
}

export type ServiceQuantities = Record<string, number>
export type ServicesByUnit = Record<string, ServiceQuantities>

const SERVICE_SELECTION_STORAGE_KEY = 'dakh-booking-service-quantities'
const SERVICE_SELECTION_BY_UNIT_KEY = 'dakh-booking-service-quantities-by-unit'

export function parseServiceQuantities(value: unknown): ServiceQuantities {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const next: ServiceQuantities = {}
  for (const [id, quantity] of Object.entries(value as Record<string, unknown>)) {
    if (typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1 && quantity <= QUANTITY_CAP) {
      next[id] = quantity
    }
  }
  return next
}

export function parseServicesByUnit(value: unknown): ServicesByUnit {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const next: ServicesByUnit = {}
  for (const [unitId, quantities] of Object.entries(value as Record<string, unknown>)) {
    if (!unitId) continue
    const parsed = parseServiceQuantities(quantities)
    if (Object.keys(parsed).length > 0) next[unitId] = parsed
  }
  return next
}

/** Legacy flat extras bind only to a known unit. Unscoped leftovers are dropped. */
export function migrateServicesByUnit(input: {
  roomTypeId?: string
  services?: unknown
  servicesByUnit?: unknown
  handoffRoomTypeId?: string
  handoffServices?: unknown
  legacyStored?: unknown
}): ServicesByUnit {
  const scoped = parseServicesByUnit(input.servicesByUnit)
  if (Object.keys(scoped).length > 0) return scoped
  const unit = input.roomTypeId || input.handoffRoomTypeId || ''
  const fromDraft = parseServiceQuantities(input.services)
  if (unit && Object.keys(fromDraft).length > 0) return { [unit]: fromDraft }
  const fromHandoff = parseServiceQuantities(input.handoffServices)
  if (input.handoffRoomTypeId && Object.keys(fromHandoff).length > 0) return { [input.handoffRoomTypeId]: fromHandoff }
  const stored = parseServiceQuantities(input.legacyStored)
  if (unit && Object.keys(stored).length > 0) return { [unit]: stored }
  return {}
}

export function servicesForUnit(byUnit: ServicesByUnit, roomTypeId: string | undefined): ServiceQuantities {
  if (!roomTypeId) return {}
  return byUnit[roomTypeId] ?? {}
}

export function setServicesForUnit(
  byUnit: ServicesByUnit,
  roomTypeId: string | undefined,
  quantities: ServiceQuantities,
): ServicesByUnit {
  if (!roomTypeId) return byUnit
  const next = { ...byUnit }
  if (Object.keys(quantities).length === 0) delete next[roomTypeId]
  else next[roomTypeId] = { ...quantities }
  return next
}

export function loadStoredServiceQuantities(): ServiceQuantities {
  return parseServiceQuantities(readJson(SERVICE_SELECTION_STORAGE_KEY))
}

export function loadServicesByUnit(): ServicesByUnit {
  return parseServicesByUnit(readJson(SERVICE_SELECTION_BY_UNIT_KEY))
}

export function persistServiceQuantities(quantities: Readonly<ServiceQuantities>) {
  writeJson(SERVICE_SELECTION_STORAGE_KEY, Object.keys(quantities).length === 0 ? null : quantities)
}

export function persistServicesByUnit(byUnit: ServicesByUnit) {
  writeJson(SERVICE_SELECTION_BY_UNIT_KEY, Object.keys(byUnit).length === 0 ? null : byUnit)
  writeJson(SERVICE_SELECTION_STORAGE_KEY, null)
}

function readJson(key: string): unknown {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof sessionStorage === 'undefined') return
  try {
    if (value == null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private mode */
  }
}

function clampQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1) return 1
  return Math.min(QUANTITY_CAP, value)
}

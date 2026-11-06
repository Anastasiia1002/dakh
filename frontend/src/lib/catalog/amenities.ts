import type { PublicAmenity } from '../publicBooking/types'

export const AMENITY_CATEGORY_ORDER = [
  'SECURITY',
  'VIEW',
  'BATHROOM',
  'OTHER_COMFORTS',
  'ENTERTAINMENT',
  'HEATING_COOLING',
  'INTERNET_WORKSPACE',
  'KITCHEN',
  'SPA',
  'NEARBY',
  'OUTDOOR',
  'OTHER',
] as const

export const AMENITY_CATEGORY_LABEL: Record<(typeof AMENITY_CATEGORY_ORDER)[number], string> = {
  SECURITY: 'Безпека',
  VIEW: 'Краєвиди',
  BATHROOM: 'Ванна кімната',
  OTHER_COMFORTS: 'Комфорт',
  ENTERTAINMENT: 'Розваги',
  HEATING_COOLING: 'Опалення та охолодження',
  INTERNET_WORKSPACE: 'Інтернет і робоче місце',
  KITCHEN: 'Кухня',
  SPA: 'SPA',
  NEARBY: 'Поруч',
  OUTDOOR: 'На відкритому повітрі',
  OTHER: 'Інше',
}

const CARD_PRIORITY = [
  'wifi',
  'air-conditioning',
  'kitchen',
  'free-on-site-parking',
  'free-off-site-parking',
  'private-terrace',
  'fireplace',
]

export function orderedAmenities(amenities: readonly PublicAmenity[] | undefined) {
  return [...(amenities ?? [])].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.key.localeCompare(right.key),
  )
}

/** Compact card chips. Only amenities present on the accommodation are eligible. */
export function cardAmenities(amenities: readonly PublicAmenity[] | undefined, limit = 4) {
  const items = orderedAmenities(amenities)
  const byKey = new Map(items.map((item) => [item.key, item]))
  const preferred = CARD_PRIORITY.flatMap((key) => {
    const item = byKey.get(key)
    return item ? [item] : []
  })
  const rest = items.filter((item) => !CARD_PRIORITY.includes(item.key))
  return [...preferred, ...rest].slice(0, limit)
}

export function amenityGroups(amenities: readonly PublicAmenity[] | undefined) {
  const items = orderedAmenities(amenities)
  return AMENITY_CATEGORY_ORDER.map((category) => ({
    category,
    label: AMENITY_CATEGORY_LABEL[category],
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)
}

/** Detail-page preview: guest-relevant keys first, then catalog order. Never invents keys. */
export function detailPreviewAmenities(amenities: readonly PublicAmenity[] | undefined, limit = 8) {
  return cardAmenities(amenities, limit)
}

export function showAmenityGroupHeading(itemCount: number) {
  return itemCount > 1
}

export type UkrainianForms = {
  one: string
  few: string
  many: string
}

/** Cardinal agreement for 1 / 2–4 / 5+, including the teens and 21, 22, 25. */
export function ukrainianPlural(count: number, forms: UkrainianForms) {
  const value = Math.abs(Math.trunc(count))
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return forms.one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few
  return forms.many
}

export function adultCountLabel(count: number) {
  return `${count} ${ukrainianPlural(count, { one: 'дорослий', few: 'дорослих', many: 'дорослих' })}`
}

export function childCountLabel(count: number) {
  return `${count} ${ukrainianPlural(count, { one: 'дитина', few: 'дитини', many: 'дітей' })}`
}

export function guestCountLabel(count: number) {
  return `${count} ${ukrainianPlural(count, { one: 'гість', few: 'гості', many: 'гостей' })}`
}

/** Booking line: 1 дорослий, otherwise N дорослих; 1 дитина, otherwise N дітей. */
export function partySummary(adults: number, children: number) {
  const adultLabel = adults === 1 ? '1 дорослий' : `${adults} дорослих`
  if (!Number.isInteger(children) || children <= 0) return adultLabel
  const childLabel = children === 1 ? '1 дитина' : `${children} дітей`
  return `${adultLabel} · ${childLabel}`
}

/** Returns the split only when stored adults and children add up to the total. */
export function knownPartySummary(adults: number | null, children: number | null, guestCount: number) {
  if (
    adults == null ||
    children == null ||
    !Number.isInteger(adults) ||
    !Number.isInteger(children) ||
    adults < 1 ||
    children < 0 ||
    adults + children !== guestCount
  ) {
    return null
  }
  return partySummary(adults, children)
}

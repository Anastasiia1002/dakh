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

export function partySummary(adults: number, children: number) {
  if (children > 0) return `${adultCountLabel(adults)}, ${childCountLabel(children)}`
  return adultCountLabel(adults)
}

const money = new Intl.NumberFormat('uk-UA')

export function formatMoney(value: number) {
  return `${money.format(value)} ₴`
}

export function formatDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`)
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function todayIso() {
  return toIso(new Date())
}

export function toIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T12:00:00`)
  const end = new Date(`${checkOut}T12:00:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export function rangesOverlap(
  a: { from: string; to: string },
  b: { from: string; to: string },
) {
  return a.from < b.to && a.to > b.from
}

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

export function formatDayMonth(iso: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${iso}T12:00:00`))
}

export function formatMonthTitle(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat('uk-UA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex, 1))
}

export function formatPriceK(value: number) {
  const thousands = value / 1000
  return `${thousands.toLocaleString('uk-UA', {
    minimumFractionDigits: thousands % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}K`
}

export const weekdaysMon = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'] as const

export function weekdayMon0(iso: string) {
  return (new Date(`${iso}T12:00:00`).getDay() + 6) % 7
}

export function addMonths(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

export function monthCells(year: number, monthIndex: number) {
  const first = toIso(new Date(year, monthIndex, 1))
  const pad = weekdayMon0(first)
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array<string | null> = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(toIso(new Date(year, monthIndex, day)))
  }
  return cells
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
  if (!checkIn || !checkOut) return 0
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

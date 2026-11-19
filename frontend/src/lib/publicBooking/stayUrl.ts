import { DATE_PATTERN, MAX_GUESTS, MIN_GUESTS } from './types'

export type StayUrlState = {
  from: string
  to: string
  adults: number
  children: number
}

function readCount(value: string | null, min: number, max: number, fallback: number) {
  if (!value || !/^\d+$/.test(value)) return fallback
  const parsed = Number(value)
  if (parsed < min || parsed > max) return fallback
  return parsed
}

export function stayUrlFromSearch(params: URLSearchParams): StayUrlState {
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  return {
    from: DATE_PATTERN.test(from) ? from : '',
    to: DATE_PATTERN.test(to) && from && to > from ? to : '',
    adults: readCount(params.get('adults'), 1, MAX_GUESTS, 2),
    children: readCount(params.get('children'), 0, MAX_GUESTS, 0),
  }
}

export function stayUrlHasRange(stay: StayUrlState) {
  return Boolean(stay.from && stay.to)
}

export function stayUrlSearch(stay: StayUrlState) {
  return mergeStayIntoSearch(new URLSearchParams(), stay).toString()
}

export function mergeStayIntoSearch(current: URLSearchParams, stay: StayUrlState) {
  const params = new URLSearchParams(current)
  if (stay.from) params.set('from', stay.from)
  else params.delete('from')
  if (stay.to) params.set('to', stay.to)
  else params.delete('to')
  if (stay.adults !== 2) params.set('adults', String(stay.adults))
  else params.delete('adults')
  if (stay.children !== 0) params.set('children', String(stay.children))
  else params.delete('children')
  const guestCount = stay.adults + stay.children
  if (guestCount < MIN_GUESTS || guestCount > MAX_GUESTS) {
    params.delete('from')
    params.delete('to')
    params.delete('adults')
    params.delete('children')
  }
  return params
}

export function stayUrlMatchesDraft(
  stay: StayUrlState,
  draft: { checkIn: string; checkOut: string; adults: number; children: number },
) {
  return (
    stay.from === draft.checkIn &&
    stay.to === draft.checkOut &&
    stay.adults === draft.adults &&
    stay.children === draft.children
  )
}

export function withStayUrl(path: string, stay: StayUrlState) {
  const query = stayUrlSearch(stay)
  return query ? `${path}?${query}` : path
}

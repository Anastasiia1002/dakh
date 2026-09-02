import type { Stay } from '../data/catalog'
import { nightsBetween, rangesOverlap } from './format'

export type BookingDraft = {
  checkIn: string
  checkOut: string
  adults: number
  children: number
  staySlug: string
  name: string
  phone: string
  email: string
  comment: string
}

export type StoredBooking = BookingDraft & {
  id: string
  nights: number
  total: number
  stayName: string
  createdAt: string
}

const STORAGE_KEY = 'dakh-bookings'

export const emptyDraft: BookingDraft = {
  checkIn: '',
  checkOut: '',
  adults: 2,
  children: 0,
  staySlug: '',
  name: '',
  phone: '',
  email: '',
  comment: '',
}

export function stayFitsGuests(stay: Stay, adults: number, children: number) {
  const total = adults + children
  if (total < 1) return false
  if (stay.extraKids) return adults <= stay.guests
  return total <= stay.guests
}

export function stayAvailable(stay: Stay, checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return true
  const request = { from: checkIn, to: checkOut }
  return !stay.blocked.some((range) => rangesOverlap(range, request))
}

export function quoteStay(stay: Stay, checkIn: string, checkOut: string) {
  const nights = Math.max(nightsBetween(checkIn, checkOut), 0)
  return {
    nights,
    total: nights * stay.priceFrom,
  }
}

export function loadBookings(): StoredBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredBooking[]) : []
  } catch {
    return []
  }
}

export function saveBooking(booking: StoredBooking) {
  const next = [booking, ...loadBookings()]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function makeBookingId() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 12)
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `SP-${stamp}-${rand}`
}

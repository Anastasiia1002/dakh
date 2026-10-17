import { publicBookingClient } from '../publicBooking/client'
import type { PublicAccommodationListResponse, PublicHotelSlug } from '../publicBooking/types'

export const CATALOG_CACHE_TTL_MS = 60_000

type Loader = (hotelSlug: PublicHotelSlug, signal: AbortSignal) => Promise<PublicAccommodationListResponse>

type Waiter = {
  signal: AbortSignal | undefined
  resolve: (value: PublicAccommodationListResponse) => void
  reject: (reason: unknown) => void
  onAbort: () => void
}

type Flight = {
  controller: AbortController
  waiters: Waiter[]
}

const fresh = new Map<PublicHotelSlug, { at: number; value: PublicAccommodationListResponse }>()
const flights = new Map<PublicHotelSlug, Flight>()

let clock = () => Date.now()
let loader: Loader = (hotelSlug, signal) => publicBookingClient.listAccommodations(hotelSlug, { signal })

export function setCatalogCacheClock(next: () => number) {
  clock = next
}

export function setCatalogLoader(next: Loader) {
  loader = next
}

export function resetCatalogCache() {
  for (const flight of flights.values()) flight.controller.abort()
  flights.clear()
  fresh.clear()
  clock = () => Date.now()
  loader = (hotelSlug, signal) => publicBookingClient.listAccommodations(hotelSlug, { signal })
}

export function invalidateCatalogCache(hotelSlug?: PublicHotelSlug) {
  if (!hotelSlug) {
    fresh.clear()
    return
  }
  fresh.delete(hotelSlug)
}

function abortError() {
  const error = new Error('The operation was aborted')
  error.name = 'AbortError'
  return error
}

function dropWaiter(hotelSlug: PublicHotelSlug, flight: Flight, waiter: Waiter) {
  flight.waiters = flight.waiters.filter((item) => item !== waiter)
  if (flight.waiters.length > 0) return
  flight.controller.abort()
  if (flights.get(hotelSlug) === flight) flights.delete(hotelSlug)
}

function subscribe(hotelSlug: PublicHotelSlug, flight: Flight, signal: AbortSignal | undefined) {
  return new Promise<PublicAccommodationListResponse>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const waiter: Waiter = {
      signal,
      resolve,
      reject,
      onAbort: () => undefined,
    }
    waiter.onAbort = () => {
      dropWaiter(hotelSlug, flight, waiter)
      reject(abortError())
    }
    flight.waiters.push(waiter)
    signal?.addEventListener('abort', waiter.onAbort, { once: true })
  })
}

function finish(hotelSlug: PublicHotelSlug, flight: Flight, error: unknown, value: PublicAccommodationListResponse | null) {
  if (flights.get(hotelSlug) === flight) flights.delete(hotelSlug)
  for (const waiter of flight.waiters) {
    waiter.signal?.removeEventListener('abort', waiter.onAbort)
    if (waiter.signal?.aborted) continue
    if (error) waiter.reject(error)
    else if (value) waiter.resolve(value)
  }
  flight.waiters = []
}

/**
 * Shared catalog list. A successful response is reused for 60 seconds.
 * Concurrent callers share one GET. Aborting one caller does not cancel a
 * request another caller still needs. Failures are not cached.
 */
export function loadAccommodationList(
  hotelSlug: PublicHotelSlug,
  signal?: AbortSignal,
  force = false,
): Promise<PublicAccommodationListResponse> {
  if (signal?.aborted) return Promise.reject(abortError())
  if (force) fresh.delete(hotelSlug)

  const cached = fresh.get(hotelSlug)
  if (!force && cached && clock() - cached.at < CATALOG_CACHE_TTL_MS) {
    return Promise.resolve(cached.value)
  }
  if (cached && clock() - cached.at >= CATALOG_CACHE_TTL_MS) fresh.delete(hotelSlug)

  const existing = flights.get(hotelSlug)
  if (existing) return subscribe(hotelSlug, existing, signal)

  const flight: Flight = { controller: new AbortController(), waiters: [] }
  flights.set(hotelSlug, flight)
  const promise = subscribe(hotelSlug, flight, signal)
  loader(hotelSlug, flight.controller.signal)
    .then((value) => {
      fresh.set(hotelSlug, { at: clock(), value })
      finish(hotelSlug, flight, null, value)
    })
    .catch((error: unknown) => {
      finish(hotelSlug, flight, error, null)
    })
  return promise
}

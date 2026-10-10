import { resolveHotelSlug, resolvePublicApiBaseUrl } from './config'
import { PublicApiError, parseApiError } from './errors'
import type { PublicAvailabilityQuery, PublicAvailabilityResponse, PublicQuoteRequest, PublicQuoteResponse } from './types'

export type PublicBookingClientOptions = {
  baseUrl?: string | null
  hotelSlug?: string
  fetch?: typeof fetch
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export class PublicBookingClient {
  private readonly baseUrl: string | null
  private readonly hotelSlug: string
  private readonly fetchFn: typeof fetch

  constructor(options: PublicBookingClientOptions = {}) {
    this.baseUrl = options.baseUrl === undefined ? resolvePublicApiBaseUrl() : options.baseUrl
    this.hotelSlug = options.hotelSlug ?? resolveHotelSlug()
    this.fetchFn = options.fetch ?? fetch.bind(globalThis)
  }

  private requireBase(): string {
    if (!this.baseUrl) {
      throw new Error('PUBLIC_API_NOT_CONFIGURED')
    }
    return this.baseUrl
  }

  private hotelPath(suffix: string) {
    return `/hotels/${encodeURIComponent(this.hotelSlug)}${suffix}`
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    let response: Response
    try {
      response = await this.fetchFn(joinUrl(this.requireBase(), path), {
        ...init,
        headers,
      })
    } catch (error) {
      if (error instanceof PublicApiError || (error instanceof Error && error.message === 'PUBLIC_API_NOT_CONFIGURED')) {
        throw error
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      throw new Error('Не вдалося зв’язатися з сервером бронювання.')
    }

    let payload: unknown = null
    const text = await response.text()
    if (text) {
      try {
        payload = JSON.parse(text) as unknown
      } catch {
        payload = null
      }
    }

    if (!response.ok) {
      throw parseApiError(response.status, payload)
    }

    return payload as T
  }

  availability(query: PublicAvailabilityQuery, init: RequestInit = {}): Promise<PublicAvailabilityResponse> {
    const params = new URLSearchParams({
      checkIn: query.checkIn,
      checkOut: query.checkOut,
    })
    if (query.guestCount != null) params.set('guestCount', String(query.guestCount))
    if (query.roomTypeId) params.set('roomTypeId', query.roomTypeId)
    return this.request<PublicAvailabilityResponse>(`${this.hotelPath('/availability')}?${params}`, init)
  }

  quote(body: PublicQuoteRequest, init: RequestInit = {}): Promise<PublicQuoteResponse> {
    return this.request<PublicQuoteResponse>(this.hotelPath('/quotes'), {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }
}

export const publicBookingClient = new PublicBookingClient()

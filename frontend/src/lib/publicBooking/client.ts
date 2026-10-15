import { isPublicHotelSlug, parseAccommodationDetail, parseAccommodationList } from './accommodation'
import { isBookingEnabled, resolveHotelSlug, resolvePublicApiBaseUrl } from './config'
import { PublicApiError, parseApiError } from './errors'
import type {
  PublicAccommodation,
  PublicAccommodationListResponse,
  PublicHotelSlug,
  ConfirmEmailVerificationRequest,
  CreateBookingIntentRequest,
  PublicAvailabilityQuery,
  PublicAvailabilityResponse,
  PublicCalendarQuery,
  PublicCalendarResponse,
  PublicBookingConfirmationResponse,
  PublicBookingIntentResponse,
  PublicOtpRequestResponse,
  PublicQuoteRequest,
  PublicQuoteResponse,
  PublicRecoverConfirmationResponse,
  RecoverConfirmationRequest,
} from './types'

export type PublicBookingClientOptions = {
  baseUrl?: string | null
  hotelSlug?: string
  fetch?: typeof fetch
  /** Defaults to the frontend booking flag. Availability and calendar stay readable either way. */
  writesEnabled?: boolean
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export class PublicBookingClient {
  private readonly baseUrl: string | null
  private readonly hotelSlug: string
  private readonly fetchFn: typeof fetch
  private readonly writesEnabled: boolean

  constructor(options: PublicBookingClientOptions = {}) {
    this.baseUrl = options.baseUrl === undefined ? resolvePublicApiBaseUrl() : options.baseUrl
    this.hotelSlug = options.hotelSlug ?? resolveHotelSlug()
    this.fetchFn = options.fetch ?? fetch.bind(globalThis)
    this.writesEnabled = options.writesEnabled ?? isBookingEnabled()
  }

  private writeRefusal(): Promise<never> | null {
    if (this.writesEnabled) return null
    return Promise.reject(new Error('BOOKING_DISABLED'))
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

  calendar(query: PublicCalendarQuery, init: RequestInit = {}): Promise<PublicCalendarResponse> {
    const params = new URLSearchParams({
      from: query.from,
      to: query.to,
    })
    if (query.guestCount != null) params.set('guestCount', String(query.guestCount))
    if (query.roomTypeId) params.set('roomTypeId', query.roomTypeId)
    return this.request<PublicCalendarResponse>(`${this.hotelPath('/availability/calendar')}?${params}`, init)
  }

  quote(body: PublicQuoteRequest, init: RequestInit = {}): Promise<PublicQuoteResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    return this.request<PublicQuoteResponse>(this.hotelPath('/quotes'), {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  createIntent(
    body: CreateBookingIntentRequest,
    init: RequestInit & { idempotencyKey?: string } = {},
  ): Promise<PublicBookingIntentResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    const { idempotencyKey, ...requestInit } = init
    const headers = new Headers(requestInit.headers)
    if (idempotencyKey?.trim()) headers.set('Idempotency-Key', idempotencyKey.trim().slice(0, 128))
    return this.request<PublicBookingIntentResponse>(this.hotelPath('/booking-intents'), {
      ...requestInit,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  }

  requestEmailVerification(intentId: string, init: RequestInit = {}): Promise<PublicOtpRequestResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    return this.request<PublicOtpRequestResponse>(
      `/booking-intents/${encodeURIComponent(intentId)}/email-verification/request`,
      { ...init, method: 'POST' },
    )
  }

  correctEmail(
    intentId: string,
    body: { email: string; acceptedTotalAmount?: string; quoteToken?: string },
    init: RequestInit & { idempotencyKey?: string } = {},
  ): Promise<PublicBookingIntentResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    return this.request<PublicBookingIntentResponse>(`/booking-intents/${encodeURIComponent(intentId)}/email`, {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  confirmEmailVerification(
    intentId: string,
    body: ConfirmEmailVerificationRequest,
    init: RequestInit = {},
  ): Promise<PublicBookingConfirmationResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    return this.request<PublicBookingConfirmationResponse>(
      `/booking-intents/${encodeURIComponent(intentId)}/email-verification/confirm`,
      {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  }

  confirmation(token: string, init: RequestInit = {}): Promise<PublicBookingConfirmationResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    return this.request<PublicBookingConfirmationResponse>(
      `/bookings/confirmation/${encodeURIComponent(token)}`,
      init,
    )
  }

  recoverConfirmation(
    intentId: string,
    body: RecoverConfirmationRequest,
    init: RequestInit = {},
  ): Promise<PublicRecoverConfirmationResponse> {
    const refused = this.writeRefusal()
    if (refused) return refused
    return this.request<PublicRecoverConfirmationResponse>(
      `/booking-intents/${encodeURIComponent(intentId)}/confirmation/recover`,
      {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  }

  /**
   * Public catalog list. Waits for a slow origin instead of treating it as an empty hotel.
   * Caller cancellation still arrives through `init.signal`.
   */
  listAccommodations(hotelSlug: PublicHotelSlug, init: RequestInit = {}): Promise<PublicAccommodationListResponse> {
    return this.readCatalog(
      hotelSlug,
      `/hotels/${encodeURIComponent(hotelSlug)}/accommodations`,
      init,
      (payload) => parseAccommodationList(payload, hotelSlug),
    )
  }

  /** One public accommodation. The live detail response is the record itself, not a wrapper. */
  getAccommodation(
    hotelSlug: PublicHotelSlug,
    slug: string,
    init: RequestInit = {},
  ): Promise<PublicAccommodation> {
    const accommodationSlug = slug.trim()
    if (!accommodationSlug) {
      return Promise.reject(
        new PublicApiError({
          statusCode: 400,
          error: 'VALIDATION_ERROR',
          message: 'Некоректна відповідь сервера.',
        }),
      )
    }
    return this.readCatalog(
      hotelSlug,
      `/hotels/${encodeURIComponent(hotelSlug)}/accommodations/${encodeURIComponent(accommodationSlug)}`,
      init,
      (payload) => parseAccommodationDetail(payload, hotelSlug),
    )
  }

  private readCatalog<T>(
    hotelSlug: PublicHotelSlug,
    path: string,
    init: RequestInit,
    parse: (payload: unknown) => T,
  ): Promise<T> {
    if (!isPublicHotelSlug(hotelSlug)) {
      return Promise.reject(
        new PublicApiError({
          statusCode: 404,
          error: 'HOTEL_NOT_FOUND',
          message: 'Готель недоступний для бронювання.',
        }),
      )
    }
    return this.request<unknown>(path, { signal: init.signal, method: 'GET' }).then(parse)
  }
}

export const publicBookingClient = new PublicBookingClient()

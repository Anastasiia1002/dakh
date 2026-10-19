/** Contracts from dakh-backend/docs/public-booking-frontend-integration.md (Phase 8B.0). */

export type PublicBookingIntentStatus =
  | 'PENDING_VERIFICATION'
  | 'CONSUMED'
  | 'EXPIRED'
  | 'CANCELLED'

export type PublicRoomKind = 'ROOM' | 'COTTAGE'

/** Hotels exposed by the public accommodation catalog. */
export type PublicHotelSlug = 'dakh' | 'sunny-park'

/** One photo from the public catalog. No pricing or availability data. */
export interface PublicAccommodationImage {
  url: string
  alt: string
  sortOrder: number
}

/**
 * Public accommodation record.
 * Fields match GET /hotels/:hotelSlug/accommodations and the detail response.
 */
export interface PublicAccommodation {
  id: string
  slug: string
  name: string
  kind: PublicRoomKind
  description: string
  maxGuests: number
  images: PublicAccommodationImage[]
  cover: PublicAccommodationImage
  hotelSlug: PublicHotelSlug
}

/** GET /hotels/:hotelSlug/accommodations */
export interface PublicAccommodationListResponse {
  hotelSlug: PublicHotelSlug
  accommodations: PublicAccommodation[]
}

export type SupportedCurrency = 'UAH'

export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string
  details?: unknown
}

export interface PublicAvailabilityQuery {
  checkIn: string
  checkOut: string
  guestCount?: number
  roomTypeId?: string
  kind?: 'ROOM' | 'COTTAGE'
}

export type PublicRateType = 'STANDARD' | 'NON_REFUNDABLE' | 'SPECIAL'

/** Quotable rate plan for the searched stay (Phase 8B.3). */
export interface PublicAvailabilityRatePlan {
  ratePlanId: string
  name: string
  type: PublicRateType
  nightlyStartingPrice: string
  totalAmount: string
  currency: SupportedCurrency
  /** Staging QA tariff only. Guests must see it as a demonstration price. */
  demo?: boolean
}

export interface PublicAvailabilityRoomType {
  roomTypeId: string
  name: string
  kind: PublicRoomKind
  maxGuests: number
  availableCount: number
  /** Min nightly start across applicable (quotable) plans only; null if none. */
  nightlyStartingPrice: string | null
  currency: SupportedCurrency
  /** Applicable rate plans for this room type and stay. Sorted cheapest total first. */
  ratePlans: PublicAvailabilityRatePlan[]
}

export interface PublicAvailabilityResponse {
  checkIn: string
  checkOut: string
  currency: SupportedCurrency
  roomTypes: PublicAvailabilityRoomType[]
}

export type PublicCalendarDayStatus = 'available' | 'booked' | 'restricted' | 'closed'

export type PublicCalendarReason = 'booking' | 'block' | 'occupancy' | 'rate' | 'inactive' | 'window' | null

export interface PublicCalendarQuery {
  from: string
  to: string
  guestCount?: number
  roomTypeId?: string
}

export interface PublicCalendarDay {
  date: string
  status: PublicCalendarDayStatus
  availableCount: number
  reason: PublicCalendarReason
  /** Present when the calendar reports the hotel booking window separately from inventory. */
  checkInEligible?: boolean
  /** This morning can end some stay the quote endpoint would accept. */
  checkoutEligible?: boolean
  minStay?: number | null
  maxStay?: number | null
}

export interface PublicCalendarRoomType {
  roomTypeId: string
  slug: string
  name: string
  kind: PublicRoomKind
  maxGuests: number
  days: PublicCalendarDay[]
}

export interface PublicCalendarResponse {
  from: string
  to: string
  hotelToday: string
  /** Hotel-local earliest check-in. Null means the booking window is closed. */
  earliestCheckIn?: string | null
  currency: SupportedCurrency
  guestCount: number | null
  roomTypes: PublicCalendarRoomType[]
}

export interface PublicQuoteRequest {
  checkIn: string
  checkOut: string
  guestCount: number
  roomTypeId: string
  ratePlanId: string
}

export interface PublicQuoteNight {
  date: string
  price: string
  currency: SupportedCurrency
}

export interface PublicQuoteResponse {
  checkIn: string
  checkOut: string
  guestCount: number
  roomTypeId: string
  ratePlanId: string
  nights: PublicQuoteNight[]
  totalAmount: string
  currency: SupportedCurrency
  quoteToken: string
  expiresAt: string
}

export interface PublicGuestContact {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface CreateBookingIntentRequest {
  checkIn: string
  checkOut: string
  guestCount: number
  roomTypeId: string
  ratePlanId: string
  quoteToken: string
  acceptedTotalAmount: string
  guest: PublicGuestContact
  guestComment?: string
}

export interface PublicBookingIntentResponse {
  intentId: string
  status: PublicBookingIntentStatus
  emailMasked: string
  verificationRequired: true
  expiresAt: string
}

export interface PublicOtpRequestResponse {
  sent: true
  cooldownSeconds: number
  otpExpiresAt: string
}

export interface ConfirmEmailVerificationRequest {
  code?: string
  acceptedTotalAmount?: string
  quoteToken?: string
}

export interface PublicBookingConfirmationResponse {
  status: 'CONFIRMED'
  bookingReference: string
  checkIn: string
  checkOut: string
  guestCount: number
  roomTypeId: string
  roomTypeName: string
  totalAmount: string
  currency: SupportedCurrency
  confirmationToken?: string
}

export interface RecoverConfirmationRequest {
  email: string
}

export interface PublicRecoverConfirmationResponse {
  sent: true
}

export interface PriceChangedDetails {
  quote: PublicQuoteResponse
}

export interface RetryAfterDetails {
  retryAfterSeconds: number
}

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/
export const OTP_PATTERN = /^\d{6}$/
export const MIN_GUESTS = 1
export const MAX_GUESTS = 20
export const MIN_NIGHTS = 1
export const MAX_NIGHTS = 30
export const MIN_PERSON_NAME = 1
export const MAX_PERSON_NAME = 100
export const MAX_GUEST_EMAIL = 200
export const MAX_RECOVER_EMAIL = 320
export const MAX_GUEST_PHONE = 40
export const MIN_QUOTE_TOKEN = 20
export const MAX_QUOTE_TOKEN = 4096
export const MIN_CONFIRMATION_TOKEN = 20
export const MAX_CONFIRMATION_TOKEN = 128
export const MAX_IDEMPOTENCY_KEY = 128

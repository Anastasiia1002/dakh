/** Contracts from dakh-backend/docs/public-booking-frontend-integration.md (Phase 8B.0). */

export type PublicBookingIntentStatus =
  | 'PENDING_VERIFICATION'
  | 'CONSUMED'
  | 'EXPIRED'
  | 'CANCELLED'

export type PublicRoomKind = 'ROOM' | 'COTTAGE'

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
}

export interface PublicAvailabilityRoomType {
  roomTypeId: string
  name: string
  kind: PublicRoomKind
  maxGuests: number
  availableCount: number
  nightlyStartingPrice: string | null
  currency: SupportedCurrency
}

export interface PublicAvailabilityResponse {
  checkIn: string
  checkOut: string
  currency: SupportedCurrency
  roomTypes: PublicAvailabilityRoomType[]
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
  phone?: string
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
export const MIN_GUESTS = 1
export const MAX_GUESTS = 20
export const MIN_NIGHTS = 1
export const MAX_NIGHTS = 30

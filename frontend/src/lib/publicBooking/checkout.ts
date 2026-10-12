import type { PublicBookingIntentResponse, PublicQuoteResponse } from './types'
import { MAX_CONFIRMATION_TOKEN, MIN_CONFIRMATION_TOKEN, MIN_QUOTE_TOKEN, OTP_PATTERN } from './types'

export type CheckoutStep =
  | 'collect'
  | 'creating_intent'
  | 'verify'
  | 'confirming'
  | 'price_changed'
  | 'looking_up'
  | 'confirmed'
  | 'unavailable'

export type StoredCheckout = {
  intentId: string
  emailMasked: string
  expiresAt: string
  roomTypeId?: string
  checkIn?: string
  checkOut?: string
  guestCount?: number
}

export type StoredStay = {
  roomTypeId: string
  checkIn: string
  checkOut: string
  guestCount: number
}

const INTENT_SESSION_KEY = 'dakh-booking-intent'
const CONFIRMATION_SESSION_KEY = 'dakh-confirmation-token'

function sessionStore() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function isQuoteFresh(quote: PublicQuoteResponse | null | undefined, now = Date.now()) {
  if (!quote?.quoteToken || quote.quoteToken.length < MIN_QUOTE_TOKEN) return false
  const expires = Date.parse(quote.expiresAt)
  return Number.isFinite(expires) && expires > now
}

export function isOtpCode(value: string) {
  return OTP_PATTERN.test(value.trim())
}

export function isConfirmationToken(value: string) {
  return value.length >= MIN_CONFIRMATION_TOKEN && value.length <= MAX_CONFIRMATION_TOKEN
}

export function newIdempotencyKey() {
  return crypto.randomUUID()
}

export function readStoredIntent(): StoredCheckout | null {
  const raw = sessionStore()?.getItem(INTENT_SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredCheckout
    if (!parsed.intentId || !parsed.emailMasked || !parsed.expiresAt) return null
    if (parsed.guestCount != null && !Number.isInteger(parsed.guestCount)) return null
    return parsed
  } catch {
    return null
  }
}

export function storedIntentMatchesStay(stored: StoredCheckout | null, stay: StoredStay) {
  if (!stored?.roomTypeId || !stored.checkIn || !stored.checkOut || stored.guestCount == null) return false
  if (intentLooksExpired(stored.expiresAt)) return false
  return (
    stored.roomTypeId === stay.roomTypeId &&
    stored.checkIn === stay.checkIn &&
    stored.checkOut === stay.checkOut &&
    stored.guestCount === stay.guestCount
  )
}

export function resumeIntentForStay(stay: StoredStay): PublicBookingIntentResponse | null {
  const stored = readStoredIntent()
  if (!storedIntentMatchesStay(stored, stay) || !stored) return null
  return {
    intentId: stored.intentId,
    status: 'PENDING_VERIFICATION',
    emailMasked: stored.emailMasked,
    verificationRequired: true,
    expiresAt: stored.expiresAt,
  }
}

export function writeStoredIntent(intent: PublicBookingIntentResponse, stay?: StoredStay) {
  const previous = readStoredIntent()
  const bound =
    stay ??
    (previous?.roomTypeId && previous.checkIn && previous.checkOut && previous.guestCount != null
      ? {
          roomTypeId: previous.roomTypeId,
          checkIn: previous.checkIn,
          checkOut: previous.checkOut,
          guestCount: previous.guestCount,
        }
      : undefined)
  sessionStore()?.setItem(
    INTENT_SESSION_KEY,
    JSON.stringify({
      intentId: intent.intentId,
      emailMasked: intent.emailMasked,
      expiresAt: intent.expiresAt,
      roomTypeId: bound?.roomTypeId,
      checkIn: bound?.checkIn,
      checkOut: bound?.checkOut,
      guestCount: bound?.guestCount,
    } satisfies StoredCheckout),
  )
}

export function clearStoredIntent() {
  sessionStore()?.removeItem(INTENT_SESSION_KEY)
}

export function readStoredConfirmationToken() {
  return sessionStore()?.getItem(CONFIRMATION_SESSION_KEY) || ''
}

export function writeStoredConfirmationToken(token: string) {
  if (!isConfirmationToken(token)) return
  sessionStore()?.setItem(CONFIRMATION_SESSION_KEY, token)
}

export function clearStoredConfirmationToken() {
  sessionStore()?.removeItem(CONFIRMATION_SESSION_KEY)
}

export function intentLooksExpired(expiresAt: string, now = Date.now()) {
  const expires = Date.parse(expiresAt)
  return Number.isFinite(expires) && expires <= now
}

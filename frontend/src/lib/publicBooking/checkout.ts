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
    return parsed
  } catch {
    return null
  }
}

export function writeStoredIntent(intent: PublicBookingIntentResponse) {
  sessionStore()?.setItem(
    INTENT_SESSION_KEY,
    JSON.stringify({
      intentId: intent.intentId,
      emailMasked: intent.emailMasked,
      expiresAt: intent.expiresAt,
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

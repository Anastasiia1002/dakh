import { publicBookingClient, type PublicBookingClient } from './client'
import { isConfirmationToken } from './checkout'
import { errorCopy, isPublicApiError } from './errors'
import { stayNights } from './stay'
import type { PublicBookingConfirmationResponse } from './types'

export const LOOKUP_EMPTY_COPY = 'Вставте код доступу з підтвердження.'
export const LOOKUP_INVALID_COPY = 'Код не підходить. Перевірте його і спробуйте ще раз.'
export const LOOKUP_RATE_COPY = 'Забагато запитів — спробуйте пізніше.'
export const LOOKUP_UNAVAILABLE_COPY = 'Зараз не можемо показати бронювання. Спробуйте ще раз.'

export type GuestBookingView = {
  reference: string
  statusLabel: 'Підтверджено'
  accommodation: string
  checkIn: string
  checkOut: string
  nights: number | null
  guests: string
  totalAmount: string
  currency: 'UAH'
}

export function normalizeAccessCode(value: string) {
  return value.trim()
}

export function accessCodeError(value: string) {
  const code = normalizeAccessCode(value)
  if (!code) return LOOKUP_EMPTY_COPY
  if (!isConfirmationToken(code)) return LOOKUP_INVALID_COPY
  return null
}

export function guestBookingView(
  response: PublicBookingConfirmationResponse,
  accommodation: string,
  guestLabel: string,
): GuestBookingView | null {
  if (response.status !== 'CONFIRMED' || response.currency !== 'UAH') return null
  const reference = response.bookingReference.trim()
  const name = accommodation.trim()
  if (!reference || !name || !response.checkIn || !response.checkOut) return null
  if (!Number.isInteger(response.guestCount) || response.guestCount < 1) return null
  const nights = stayNights(response.checkIn, response.checkOut)
  return {
    reference,
    statusLabel: 'Підтверджено',
    accommodation: name,
    checkIn: response.checkIn,
    checkOut: response.checkOut,
    nights: nights > 0 ? nights : null,
    guests: guestLabel,
    totalAmount: response.totalAmount,
    currency: 'UAH',
  }
}

export function lookupFailureCopy(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message === LOOKUP_EMPTY_COPY ||
      error.message === LOOKUP_INVALID_COPY ||
      error.message === LOOKUP_UNAVAILABLE_COPY
    ) {
      return error.message
    }
  }
  if (isPublicApiError(error)) {
    if (error.error === 'CONFIRMATION_NOT_FOUND' || error.statusCode === 404) return LOOKUP_INVALID_COPY
    if (error.error === 'RATE_LIMITED' || error.statusCode === 429) return LOOKUP_RATE_COPY
  }
  return errorCopy(error) || LOOKUP_UNAVAILABLE_COPY
}

export async function lookupGuestBooking(
  code: string,
  accommodationName: (roomTypeId: string, roomTypeName: string) => string,
  guestLabel: (guestCount: number) => string,
  client: Pick<PublicBookingClient, 'confirmation'> = publicBookingClient,
) {
  const accessCode = normalizeAccessCode(code)
  const invalid = accessCodeError(accessCode)
  if (invalid) throw new Error(invalid)
  const response = await client.confirmation(accessCode, { cache: 'no-store' })
  const view = guestBookingView(response, accommodationName(response.roomTypeId, response.roomTypeName), guestLabel(response.guestCount))
  if (!view) throw new Error(LOOKUP_UNAVAILABLE_COPY)
  return view
}

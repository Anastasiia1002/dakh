import { knownPartySummary } from '../ukrainian'
import { publicBookingClient, type PublicBookingClient } from './client'
import { canonicalAccessCode, isConfirmationToken } from './checkout'
import { errorCopy, isPublicApiError } from './errors'
import { stayNights } from './stay'
import type { GuestPaymentStatus, PublicBookingConfirmationResponse, PublicBookingStatus } from './types'

const BOOKING_REFERENCE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COMPACT_BOOKING_REFERENCE = /^[0-9a-f]{32}$/i

export const LOOKUP_EMPTY_COPY = 'Вставте код доступу з підтвердження.'
export const LOOKUP_FORMAT_COPY = 'Новий код має вигляд ABCD-EFGH-JKLM. Раніше виданий довгий код теж підходить.'
export const LOOKUP_INVALID_COPY = 'Код не підходить. Перевірте його і спробуйте ще раз.'
export const ACCESS_CODE_FIND_COPY =
  'Код доступу показано окремо на екрані підтвердження і в листі, у рядку «Код доступу до підтвердження». Номер бронювання його не замінює.'
export const LOOKUP_REFERENCE_COPY = `Це номер бронювання, а не код доступу. ${ACCESS_CODE_FIND_COPY}`
export const MISSING_SESSION_COPY =
  'Код доступу в цьому вікні вже недоступний. Він був на екрані одразу після бронювання і в листі, у рядку «Код доступу до підтвердження». Номер бронювання його не замінює.'
export const LOOKUP_RATE_COPY = 'Забагато запитів — спробуйте пізніше.'
export const LOOKUP_UNAVAILABLE_COPY = 'Зараз не можемо показати бронювання. Спробуйте ще раз.'

export type GuestBookingView = {
  reference: string
  status: PublicBookingStatus
  statusLabel: string
  cancelled: boolean
  accommodation: string
  roomNumber: string | null
  checkIn: string
  checkOut: string
  nights: number | null
  adults: number | null
  children: number | null
  guests: string
  totalAmount: string
  currency: 'UAH'
  services: Array<{ serviceId: string; name: string; quantity: number; totalPrice: string }>
  paymentLabel: string | null
}

export function guestStatusLabel(status: string) {
  return STATUS_LABELS[status as PublicBookingStatus] ?? ''
}

const STATUS_LABELS: Record<PublicBookingStatus, string> = {
  PENDING: 'Очікує підтвердження',
  CONFIRMED: 'Підтверджено',
  CHECKED_IN: 'Заселено',
  CHECKED_OUT: 'Виселено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не заїхав',
}

const PAYMENT_LABELS: Record<GuestPaymentStatus, string> = {
  UNPAID: 'Не оплачено',
  PENDING: 'Очікує оплату',
  PAID: 'Оплачено',
  FAILED: 'Оплату не проведено',
  REFUNDED: 'Повернено',
}

export function normalizeAccessCode(value: string) {
  return canonicalAccessCode(value)
}

export function accessCodeError(value: string) {
  const code = normalizeAccessCode(value)
  if (!code) return LOOKUP_EMPTY_COPY
  if (BOOKING_REFERENCE.test(code) || COMPACT_BOOKING_REFERENCE.test(code)) return LOOKUP_REFERENCE_COPY
  if (!isConfirmationToken(code)) return LOOKUP_INVALID_COPY
  return null
}

export function guestBookingView(
  response: PublicBookingConfirmationResponse,
  accommodation: string,
  guestLabel: string,
): GuestBookingView | null {
  const statusLabel = STATUS_LABELS[response.status]
  if (!statusLabel || response.currency !== 'UAH') return null
  const reference = response.bookingReference.trim()
  const name = accommodation.trim()
  if (!reference || !name || !response.checkIn || !response.checkOut) return null
  if (!Number.isInteger(response.guestCount) || response.guestCount < 1) return null
  const adults = integerOrNull(response.adults)
  const children = integerOrNull(response.children)
  const nights = stayNights(response.checkIn, response.checkOut)
  return {
    reference,
    status: response.status,
    statusLabel,
    cancelled: response.status === 'CANCELLED',
    accommodation: name,
    roomNumber: response.roomNumber?.trim() || null,
    checkIn: response.checkIn,
    checkOut: response.checkOut,
    nights: nights > 0 ? nights : null,
    adults,
    children,
    guests: knownPartySummary(adults, children, response.guestCount) ?? guestLabel,
    totalAmount: response.totalAmount,
    currency: 'UAH',
    services: (response.services ?? [])
      .filter((line) => line.name.trim() && line.quantity > 0)
      .map((line) => ({
        serviceId: line.serviceId,
        name: line.name,
        quantity: line.quantity,
        totalPrice: line.totalPrice,
      })),
    paymentLabel: response.paymentStatus ? PAYMENT_LABELS[response.paymentStatus] : null,
  }
}

function integerOrNull(value: number | undefined) {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

export function lookupFailureCopy(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message === LOOKUP_EMPTY_COPY ||
      error.message === LOOKUP_INVALID_COPY ||
      error.message === LOOKUP_REFERENCE_COPY ||
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

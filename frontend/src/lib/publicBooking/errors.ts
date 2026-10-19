import { BOOKING_DISABLED_COPY } from './config'
import type { ApiErrorBody, PublicQuoteResponse } from './types'
import { MIN_QUOTE_TOKEN } from './types'

export class PublicApiError extends Error {
  readonly statusCode: number
  readonly error: string
  readonly details?: unknown

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'PublicApiError'
    this.statusCode = body.statusCode
    this.error = body.error
    this.details = body.details
  }
}

export function isPublicApiError(value: unknown): value is PublicApiError {
  return value instanceof PublicApiError
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseApiError(status: number, payload: unknown): PublicApiError {
  if (isRecord(payload) && typeof payload.error === 'string' && typeof payload.message === 'string') {
    return new PublicApiError({
      statusCode: typeof payload.statusCode === 'number' ? payload.statusCode : status,
      error: payload.error,
      message: payload.message,
      details: payload.details,
    })
  }

  return new PublicApiError({
    statusCode: status,
    error: status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
    message: status >= 500 ? 'Внутрішня помилка сервера' : 'Некоректна відповідь сервера.',
  })
}

const SAFE_COPY: Record<string, string> = {
  VALIDATION_ERROR: 'Перевірте заповнені поля.',
  UNAVAILABLE: 'На ці дати немає вільних кімнат. Оберіть інші дати.',
  PRICE_CHANGED: 'Ціна змінилася — потрібне нове підтвердження.',
  EMAIL_UNAVAILABLE: 'Сервіс електронної пошти недоступний. Код зараз надіслати не можна.',
  RATE_LIMITED: 'Забагато запитів — спробуйте пізніше.',
  OTP_COOLDOWN: 'Зачекайте, перш ніж надіслати код ще раз.',
  OTP_RATE_LIMITED: 'Забагато спроб підтвердження. Спробуйте пізніше.',
  INVALID_CODE: 'Невірний або прострочений код.',
  INTENT_EXPIRED: 'Час на підтвердження минув. Почніть бронювання знову.',
  QUOTE_INVALID: 'Розрахунок застарів. Оберіть дати ще раз.',
  INTENT_NOT_FOUND: 'Заявку не знайдено.',
  CONFIRMATION_NOT_FOUND: 'Підтвердження не знайдено.',
  HOTEL_NOT_FOUND: 'Готель недоступний для бронювання.',
  ROOM_TYPE_NOT_FOUND: 'Цю кімнату зараз не можна забронювати.',
  RATE_PLAN_NOT_FOUND: 'Цей тариф недоступний.',
  IDEMPOTENCY_CONFLICT: 'Заявку вже надіслано з іншими даними. Оновіть сторінку.',
  PUBLIC_BOOKING_UNAVAILABLE: 'Публічне бронювання зараз недоступне.',
  EMAIL_DELIVERY_FAILED: 'Не вдалося надіслати лист. Спробуйте ще раз.',
}

export function errorCopy(error: unknown): string {
  if (isPublicApiError(error)) {
    if (
      error.error === 'INTERNAL_ERROR' ||
      (error.statusCode >= 500 && error.error !== 'EMAIL_UNAVAILABLE' && error.error !== 'EMAIL_DELIVERY_FAILED')
    ) {
      return 'Сервер бронювання тимчасово недоступний. Спробуйте пізніше.'
    }
    if (error.message && error.error !== 'INTERNAL_ERROR') return error.message
    return SAFE_COPY[error.error] ?? 'Не вдалося виконати запит бронювання.'
  }
  if (error instanceof Error && error.message === 'PUBLIC_API_NOT_CONFIGURED') {
    return 'Бронювання ще не підключене до сервера. Додайте VITE_PUBLIC_API_BASE_URL.'
  }
  if (error instanceof Error && error.message === 'BOOKING_DISABLED') {
    return BOOKING_DISABLED_COPY
  }
  if (error instanceof Error && error.message === 'BOOKING_TARGET_BLOCKED') {
    return 'Заявку з цього запуску можна надіслати лише на локальний сервер бронювання.'
  }
  return 'Не вдалося зв’язатися з сервером бронювання.'
}

export function retryAfterSeconds(error: unknown): number | null {
  if (!isPublicApiError(error) || !isRecord(error.details)) return null
  const value = error.details.retryAfterSeconds
  return typeof value === 'number' && value >= 0 ? value : null
}

export function quoteFromPriceChanged(error: unknown): PublicQuoteResponse | null {
  if (!isPublicApiError(error) || error.error !== 'PRICE_CHANGED' || !isRecord(error.details)) return null
  const quote = error.details.quote
  if (!isRecord(quote)) return null
  if (typeof quote.quoteToken !== 'string' || quote.quoteToken.length < MIN_QUOTE_TOKEN) return null
  if (typeof quote.totalAmount !== 'string' || typeof quote.checkIn !== 'string') return null
  return quote as unknown as PublicQuoteResponse
}

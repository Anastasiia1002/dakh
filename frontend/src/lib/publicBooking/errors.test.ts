import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { errorCopy, isAbortError, parseApiError, stayRejection, STAY_RANGE_COPY, STAY_WINDOW_COPY } from './errors'

describe('public API errors', () => {
  it('prefers the structured error code and Ukrainian message', () => {
    const error = parseApiError(409, {
      statusCode: 409,
      error: 'UNAVAILABLE',
      message: 'На ці дати немає вільних кімнат',
    })
    assert.equal(error.error, 'UNAVAILABLE')
    assert.equal(errorCopy(error), 'На ці дати немає вільних кімнат')
  })

  it('explains a disabled booking action without claiming the API itself is blocked', () => {
    const copy = errorCopy(new Error('BOOKING_DISABLED'))
    assert.match(copy, /вимкнене/)
    assert.doesNotMatch(copy, /забороняє|авторизац/i)
  })

  it('explains a missing frontend API origin without inventing a server field', () => {
    assert.match(errorCopy(new Error('PUBLIC_API_NOT_CONFIGURED')), /VITE_PUBLIC_API_BASE_URL/)
  })

  it('hides internal server errors from guests', () => {
    const error = parseApiError(500, {
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'stack dump',
    })
    assert.match(errorCopy(error), /тимчасово недоступний/)
    assert.doesNotMatch(errorCopy(error), /stack dump/)
  })

  it('maps OTP, intent, confirmation and delivery failures to guest-safe copy', () => {
    const cases = [
      ['INVALID_CODE', 401, 'Невірний або прострочений код'],
      ['OTP_COOLDOWN', 429, 'Зачекайте перед повторним надсиланням коду'],
      ['OTP_RATE_LIMITED', 429, 'Перевищено кількість спроб перевірки'],
      ['INTENT_EXPIRED', 409, 'Термін дії заявки закінчився'],
      ['CONFIRMATION_NOT_FOUND', 404, 'Підтвердження не знайдено'],
      ['PUBLIC_BOOKING_UNAVAILABLE', 404, 'Публічне бронювання недоступне'],
      ['EMAIL_DELIVERY_FAILED', 503, 'Не вдалося надіслати лист. Спробуйте ще раз.'],
    ] as const
    for (const [code, status, message] of cases) {
      assert.equal(errorCopy(parseApiError(status, { statusCode: status, error: code, message })), message)
    }
    assert.match(errorCopy(new Error('BOOKING_TARGET_BLOCKED')), /локальний сервер/)
  })

  it('hides the raw validation message and names the stay rule the server rejected', () => {
    const tooEarly = parseApiError(400, {
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Некоректні дані запиту',
      details: ['checkIn: заїзд занадто рано відносно мінімального часу бронювання'],
    })
    const minimum = parseApiError(400, {
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Некоректні дані запиту',
      details: ['checkOut: тариф вимагає мінімум 3 ночей'],
    })
    const guests = parseApiError(400, {
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Некоректні дані запиту',
      details: ['guestCount: перевищує місткість категорії'],
    })
    assert.equal(errorCopy(tooEarly), 'Перевірте заповнені поля.')
    assert.doesNotMatch(errorCopy(tooEarly), /Некоректні дані запиту|VALIDATION_ERROR/)
    assert.equal(stayRejection(tooEarly)?.kind, 'check-in')
    assert.equal(stayRejection(tooEarly)?.message, STAY_WINDOW_COPY)
    assert.equal(stayRejection(minimum)?.kind, 'range')
    assert.equal(stayRejection(minimum)?.message, STAY_RANGE_COPY)
    assert.equal(stayRejection(guests)?.kind, 'guests')
    assert.doesNotMatch(`${stayRejection(tooEarly)?.message}${stayRejection(minimum)?.message}`, /VALIDATION_ERROR|Некоректні/)
  })

  it('recognizes AbortError so stale requests can be ignored', () => {
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    assert.equal(isAbortError(abortError), true)
    assert.equal(isAbortError(new Error('network')), false)
  })
})

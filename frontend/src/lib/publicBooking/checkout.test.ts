import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isConfirmationToken, isOtpCode, isQuoteFresh, storedIntentMatchesStay } from './checkout'
import { quoteFromPriceChanged, retryAfterSeconds } from './errors'
import { PublicApiError } from './errors'

const quote = {
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  guestCount: 2,
  roomTypeId: '11111111-1111-4111-8111-111111111111',
  ratePlanId: '22222222-2222-4222-8222-222222222222',
  nights: [{ date: '2026-12-01', price: '4800.00', currency: 'UAH' as const }],
  totalAmount: '9600.00',
  currency: 'UAH' as const,
  quoteToken: 'q'.repeat(24),
  expiresAt: '2026-12-01T12:15:00.000Z',
}

describe('checkout helpers', () => {
  it('treats a quote as stale after expiresAt', () => {
    assert.equal(isQuoteFresh(quote, Date.parse('2026-12-01T12:14:00.000Z')), true)
    assert.equal(isQuoteFresh(quote, Date.parse('2026-12-01T12:16:00.000Z')), false)
    assert.equal(isQuoteFresh({ ...quote, quoteToken: 'short' }), false)
  })

  it('accepts a 6-digit OTP and a long enough confirmation token', () => {
    assert.equal(isOtpCode('123456'), true)
    assert.equal(isOtpCode('12345'), false)
    assert.equal(isConfirmationToken('c'.repeat(24)), true)
    assert.equal(isConfirmationToken('short'), false)
  })

  it('reads PRICE_CHANGED details.quote and retryAfterSeconds', () => {
    const error = new PublicApiError({
      statusCode: 409,
      error: 'PRICE_CHANGED',
      message: 'Ціна змінилася — потрібне нове підтвердження',
      details: { quote },
    })
    assert.equal(quoteFromPriceChanged(error)?.totalAmount, '9600.00')
    assert.equal(quoteFromPriceChanged(new Error('no')), null)
    assert.equal(
      retryAfterSeconds(
        new PublicApiError({
          statusCode: 429,
          error: 'RATE_LIMITED',
          message: 'Забагато запитів — спробуйте пізніше',
          details: { retryAfterSeconds: 12 },
        }),
      ),
      12,
    )
  })

  it('resumes a pending intent only for the same stay', () => {
    const stored = {
      intentId: '11111111-1111-4111-8111-111111111111',
      emailMasked: 'ox***@example.test',
      expiresAt: '2099-01-01T00:00:00.000Z',
      roomTypeId: '33333333-3333-4333-8333-333333333331',
      checkIn: '2026-12-15',
      checkOut: '2026-12-17',
      guestCount: 2,
    }
    const stay = {
      roomTypeId: stored.roomTypeId,
      checkIn: stored.checkIn,
      checkOut: stored.checkOut,
      guestCount: 2,
    }
    assert.equal(storedIntentMatchesStay(stored, stay), true)
    assert.equal(storedIntentMatchesStay(stored, { ...stay, checkOut: '2026-12-18' }), false)
    assert.equal(storedIntentMatchesStay({ ...stored, roomTypeId: undefined }, stay), false)
    assert.equal(storedIntentMatchesStay({ ...stored, expiresAt: '2000-01-01T00:00:00.000Z' }, stay), false)
  })
})

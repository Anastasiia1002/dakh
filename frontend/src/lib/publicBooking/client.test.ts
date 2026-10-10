import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PublicBookingClient } from './client'
import { PublicApiError } from './errors'

const availabilityOk = {
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  currency: 'UAH',
  roomTypes: [
    {
      roomTypeId: '11111111-1111-4111-8111-111111111111',
      name: 'Тестова кімната',
      kind: 'ROOM',
      maxGuests: 2,
      availableCount: 1,
      nightlyStartingPrice: '4500.00',
      currency: 'UAH',
      ratePlans: [
        {
          ratePlanId: '22222222-2222-4222-8222-222222222222',
          name: 'Неповернений',
          type: 'NON_REFUNDABLE',
          nightlyStartingPrice: '4500.00',
          totalAmount: '9000.00',
          currency: 'UAH',
        },
        {
          ratePlanId: '33333333-3333-4333-8333-333333333333',
          name: 'Стандарт',
          type: 'STANDARD',
          nightlyStartingPrice: '4800.00',
          totalAmount: '9600.00',
          currency: 'UAH',
        },
      ],
    },
  ],
}

const quoteOk = {
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  guestCount: 2,
  roomTypeId: '11111111-1111-4111-8111-111111111111',
  ratePlanId: '22222222-2222-4222-8222-222222222222',
  nights: [
    { date: '2026-12-01', price: '4800.00', currency: 'UAH' },
    { date: '2026-12-02', price: '4800.00', currency: 'UAH' },
  ],
  totalAmount: '9600.00',
  currency: 'UAH',
  quoteToken: 'x'.repeat(24),
  expiresAt: '2026-12-01T12:15:00.000Z',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PublicBookingClient', () => {
  it('requests availability with the documented query string', async () => {
    const calls: unknown[] = []
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push([input, init])
      return jsonResponse(availabilityOk)
    }
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
    })

    const result = await client.availability({
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      guestCount: 2,
    })

    assert.equal(calls.length, 1)
    const [url] = calls[0] as [string]
    assert.equal(
      url,
      'http://localhost:3000/api/public/v1/hotels/dakh/availability?checkIn=2026-12-01&checkOut=2026-12-03&guestCount=2',
    )
    assert.equal(result.roomTypes.length, 1)
    assert.equal(result.roomTypes[0]?.nightlyStartingPrice, '4500.00')
    assert.equal(result.roomTypes[0]?.ratePlans.length, 2)
    assert.equal(result.roomTypes[0]?.ratePlans[0]?.ratePlanId, '22222222-2222-4222-8222-222222222222')
    assert.equal(result.roomTypes[0]?.ratePlans[0]?.totalAmount, '9000.00')
  })

  it('treats an empty roomTypes array as valid inventory emptiness', async () => {
    const fetchMock: typeof fetch = async () =>
      jsonResponse({ checkIn: '2026-12-01', checkOut: '2026-12-03', currency: 'UAH', roomTypes: [] })
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
    })

    const result = await client.availability({ checkIn: '2026-12-01', checkOut: '2026-12-03', guestCount: 2 })
    assert.deepEqual(result.roomTypes, [])
  })

  it('posts a quote body with only documented fields', async () => {
    const calls: unknown[] = []
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push([input, init])
      return jsonResponse(quoteOk)
    }
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
    })

    const body = {
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      guestCount: 2,
      roomTypeId: '11111111-1111-4111-8111-111111111111',
      ratePlanId: '22222222-2222-4222-8222-222222222222',
    }
    const result = await client.quote(body)
    const [, init] = calls[0] as [string, RequestInit]
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(String(init.body)), body)
    assert.equal(result.totalAmount, '9600.00')
    assert.equal(result.nights.length, 2)
  })

  it('maps structured API errors by error code', async () => {
    const fetchMock: typeof fetch = async () =>
      jsonResponse(
        {
          statusCode: 409,
          error: 'UNAVAILABLE',
          message: 'На ці дати немає вільних кімнат',
        },
        409,
      )
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
    })

    await assert.rejects(
      () =>
        client.quote({
          checkIn: '2026-12-01',
          checkOut: '2026-12-03',
          guestCount: 2,
          roomTypeId: '11111111-1111-4111-8111-111111111111',
          ratePlanId: '22222222-2222-4222-8222-222222222222',
        }),
      (error: unknown) => {
        assert.ok(error instanceof PublicApiError)
        assert.equal(error.error, 'UNAVAILABLE')
        assert.equal(error.statusCode, 409)
        return true
      },
    )
  })

  it('rethrows AbortError instead of wrapping it as a network failure', async () => {
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: async () => {
        throw abortError
      },
    })

    await assert.rejects(
      () => client.availability({ checkIn: '2026-12-01', checkOut: '2026-12-03', guestCount: 2 }),
      (error: unknown) => error === abortError,
    )
  })

  it('creates an intent with Idempotency-Key and documented guest fields', async () => {
    const calls: unknown[] = []
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push([input, init])
      return jsonResponse(
        {
          intentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          status: 'PENDING_VERIFICATION',
          emailMasked: 'iv***@example.com',
          verificationRequired: true,
          expiresAt: '2026-12-01T13:00:00.000Z',
        },
        201,
      )
    }
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
    })
    const body = {
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      guestCount: 2,
      roomTypeId: '11111111-1111-4111-8111-111111111111',
      ratePlanId: '22222222-2222-4222-8222-222222222222',
      quoteToken: 'x'.repeat(24),
      acceptedTotalAmount: '9600.00',
      guest: { firstName: 'Іван', lastName: 'Коваленко', email: 'ivan@example.com', phone: '+380501112233' },
    }
    const result = await client.createIntent(body, { idempotencyKey: 'attempt-1' })
    const [url, init] = calls[0] as [string, RequestInit]
    assert.equal(url, 'http://localhost:3000/api/public/v1/hotels/dakh/booking-intents')
    assert.equal(init.method, 'POST')
    assert.equal(new Headers(init.headers).get('Idempotency-Key'), 'attempt-1')
    assert.deepEqual(JSON.parse(String(init.body)), body)
    assert.equal(result.status, 'PENDING_VERIFICATION')
  })

  it('requests OTP, confirms a code, looks up confirmation and recovers', async () => {
    const calls: unknown[] = []
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push([String(input), init])
      const url = String(input)
      if (url.includes('/email-verification/request')) {
        return jsonResponse({ sent: true, cooldownSeconds: 60, otpExpiresAt: '2026-12-01T12:10:00.000Z' }, 201)
      }
      if (url.includes('/email-verification/confirm')) {
        return jsonResponse({
          status: 'CONFIRMED',
          bookingReference: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          checkIn: '2026-12-01',
          checkOut: '2026-12-03',
          guestCount: 2,
          roomTypeId: '11111111-1111-4111-8111-111111111111',
          roomTypeName: 'Буковина',
          totalAmount: '9600.00',
          currency: 'UAH',
          confirmationToken: 'c'.repeat(24),
        })
      }
      if (url.includes('/bookings/confirmation/')) {
        return jsonResponse({
          status: 'CONFIRMED',
          bookingReference: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          checkIn: '2026-12-01',
          checkOut: '2026-12-03',
          guestCount: 2,
          roomTypeId: '11111111-1111-4111-8111-111111111111',
          roomTypeName: 'Буковина',
          totalAmount: '9600.00',
          currency: 'UAH',
        })
      }
      return jsonResponse({ sent: true })
    }
    const client = new PublicBookingClient({
      baseUrl: 'http://localhost:3000/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
    })
    const intentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const otp = await client.requestEmailVerification(intentId)
    const confirmed = await client.confirmEmailVerification(intentId, { code: '123456' })
    const lookup = await client.confirmation('c'.repeat(24))
    const recovered = await client.recoverConfirmation(intentId, { email: 'ivan@example.com' })
    assert.equal(otp.sent, true)
    assert.equal(confirmed.confirmationToken?.length, 24)
    assert.equal(lookup.bookingReference, confirmed.bookingReference)
    assert.equal(lookup.confirmationToken, undefined)
    assert.equal(recovered.sent, true)
    const requestUrl = calls[0]?.[0]
    const confirmInit = calls[1]?.[1] as RequestInit | undefined
    const recoverInit = calls[3]?.[1] as RequestInit | undefined
    assert.equal(requestUrl, `http://localhost:3000/api/public/v1/booking-intents/${intentId}/email-verification/request`)
    assert.ok(confirmInit)
    assert.ok(recoverInit)
    assert.deepEqual(JSON.parse(String(confirmInit.body)), { code: '123456' })
    assert.deepEqual(JSON.parse(String(recoverInit.body)), { email: 'ivan@example.com' })
  })

  it('fails closed when the public API base is not configured', async () => {
    const client = new PublicBookingClient({ baseUrl: null, hotelSlug: 'dakh', fetch: async () => new Response() })
    await assert.rejects(
      () => client.availability({ checkIn: '2026-12-01', checkOut: '2026-12-03', guestCount: 2 }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.equal(error.message, 'PUBLIC_API_NOT_CONFIGURED')
        return true
      },
    )
  })
})

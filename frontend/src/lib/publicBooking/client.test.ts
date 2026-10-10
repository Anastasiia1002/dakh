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
      nightlyStartingPrice: '4800.00',
      currency: 'UAH',
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
    assert.equal(result.roomTypes[0]?.nightlyStartingPrice, '4800.00')
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

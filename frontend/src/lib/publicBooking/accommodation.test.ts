import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PublicBookingClient } from './client'
import { PublicApiError } from './errors'
import type { PublicAccommodation, PublicHotelSlug } from './types'

const forbidden = [
  'price',
  'priceFrom',
  'totalAmount',
  'nightlyStartingPrice',
  'availableCount',
  'ratePlans',
  'currency',
  'quoteToken',
  'bookingId',
]

function image(url: string, sortOrder: number) {
  return { url, alt: 'Фото', sortOrder }
}

function accommodation(hotelSlug: PublicHotelSlug, slug: string, kind: 'ROOM' | 'COTTAGE', maxGuests: number) {
  return {
    id: `11111111-1111-4111-8111-${slug.replace(/\W/g, '').slice(0, 12).padEnd(12, '0')}`,
    slug,
    name: slug,
    kind,
    description: 'Опис без ціни.',
    maxGuests,
    images: [image(`https://photos.bookmenow.pro/${slug}.webp`, 0)],
    cover: image(`https://photos.bookmenow.pro/${slug}-cover.webp`, 1),
    hotelSlug,
    totalAmount: '100.00',
    availableCount: 1,
  }
}

function list(hotelSlug: PublicHotelSlug, count: number, kind: 'ROOM' | 'COTTAGE') {
  return {
    hotelSlug,
    accommodations: Array.from({ length: count }, (_, index) =>
      accommodation(hotelSlug, `${hotelSlug}-${index + 1}`, kind, kind === 'ROOM' ? 2 : 5),
    ),
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function client(fetchMock: typeof fetch) {
  return new PublicBookingClient({
    baseUrl: 'https://dakh-backend.onrender.com/api/public/v1',
    hotelSlug: 'dakh',
    fetch: fetchMock,
  })
}

function assertCatalogRecord(record: PublicAccommodation) {
  assert.deepEqual(Object.keys(record).sort(), [
    'cover',
    'description',
    'hotelSlug',
    'id',
    'images',
    'kind',
    'maxGuests',
    'name',
    'slug',
  ])
  for (const key of forbidden) assert.equal(key in record, false)
  assert.deepEqual(Object.keys(record.cover).sort(), ['alt', 'sortOrder', 'url'])
  assert.equal(record.images.some((item) => forbidden.some((key) => key in item)), false)
}

describe('public accommodation catalog', () => {
  it('lists both hotels with GET and drops non-catalog fields', async () => {
    const calls: Array<[string, RequestInit | undefined]> = []
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push([String(input), init])
      const hotel = String(input).includes('/sunny-park/') ? 'sunny-park' : 'dakh'
      return jsonResponse(list(hotel, hotel === 'dakh' ? 3 : 6, hotel === 'dakh' ? 'ROOM' : 'COTTAGE'))
    }
    const api = client(fetchMock)

    const dakh = await api.listAccommodations('dakh')
    const sunny = await api.listAccommodations('sunny-park')

    assert.equal(dakh.hotelSlug, 'dakh')
    assert.equal(dakh.accommodations.length, 3)
    assert.equal(dakh.accommodations.every((item) => item.kind === 'ROOM'), true)
    assert.equal(sunny.hotelSlug, 'sunny-park')
    assert.equal(sunny.accommodations.length, 6)
    assert.equal(sunny.accommodations.every((item) => item.kind === 'COTTAGE'), true)
    for (const item of [...dakh.accommodations, ...sunny.accommodations]) assertCatalogRecord(item)
    assert.deepEqual(
      calls.map(([url, init]) => [url, init?.method]),
      [
        ['https://dakh-backend.onrender.com/api/public/v1/hotels/dakh/accommodations', 'GET'],
        ['https://dakh-backend.onrender.com/api/public/v1/hotels/sunny-park/accommodations', 'GET'],
      ],
    )
  })

  it('reads one accommodation from the unwrapped detail response', async () => {
    let method = ''
    const fetchMock: typeof fetch = async (_input, init) => {
      method = init?.method ?? ''
      return jsonResponse(accommodation('dakh', 'dakh-room-14-1', 'ROOM', 4))
    }
    const result = await client(fetchMock).getAccommodation('dakh', 'dakh-room-14-1')
    assert.equal(method, 'GET')
    assert.equal(result.slug, 'dakh-room-14-1')
    assert.equal(result.maxGuests, 4)
    assert.equal(result.hotelSlug, 'dakh')
    assertCatalogRecord(result)
  })

  it('waits for a slow catalog response instead of returning an empty list', async () => {
    const fetchMock: typeof fetch = async () => {
      await new Promise((resolve) => setTimeout(resolve, 40))
      return jsonResponse(list('dakh', 3, 'ROOM'))
    }
    const result = await client(fetchMock).listAccommodations('dakh')
    assert.equal(result.accommodations.length, 3)
  })

  it('forwards AbortSignal and does not wrap cancellation as a network failure', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetchMock: typeof fetch = async (_input, init) => {
      assert.equal(init?.signal?.aborted, true)
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      throw error
    }
    await assert.rejects(
      () => client(fetchMock).listAccommodations('dakh', { signal: controller.signal, method: 'POST' }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.equal(error.name, 'AbortError')
        return true
      },
    )
  })

  it('rejects a 404, a 500, invalid JSON and an unexpected shape', async () => {
    const cases: Array<{ body: BodyInit; status: number; error: string }> = [
      {
        body: JSON.stringify({ statusCode: 404, error: 'ROOM_TYPE_NOT_FOUND', message: 'Тип розміщення не знайдено' }),
        status: 404,
        error: 'ROOM_TYPE_NOT_FOUND',
      },
      {
        body: JSON.stringify({ statusCode: 500, error: 'INTERNAL_ERROR', message: 'Внутрішня помилка сервера' }),
        status: 500,
        error: 'INTERNAL_ERROR',
      },
      { body: 'not-json', status: 200, error: 'VALIDATION_ERROR' },
      { body: JSON.stringify({ hotelSlug: 'dakh', rooms: [] }), status: 200, error: 'VALIDATION_ERROR' },
    ]
    for (const item of cases) {
      const fetchMock: typeof fetch = async () =>
        new Response(item.body, { status: item.status, headers: { 'Content-Type': 'application/json' } })
      await assert.rejects(() => client(fetchMock).getAccommodation('dakh', 'dakh-room-14-1'), (error: unknown) => {
        assert.ok(error instanceof PublicApiError)
        assert.equal(error.error, item.error)
        assert.equal(error.statusCode, item.status === 200 ? 200 : item.status)
        return true
      })
    }
  })

  it('reports a network failure without calling another endpoint', async () => {
    let calls = 0
    const fetchMock: typeof fetch = async () => {
      calls += 1
      throw new TypeError('Failed to fetch')
    }
    await assert.rejects(() => client(fetchMock).listAccommodations('sunny-park'), /зв’язатися з сервером/)
    assert.equal(calls, 1)
  })

  it('does not request an unsupported hotel slug', async () => {
    let calls = 0
    const fetchMock: typeof fetch = async () => {
      calls += 1
      return jsonResponse(list('dakh', 3, 'ROOM'))
    }
    await assert.rejects(
      () => client(fetchMock).listAccommodations('bukovyna' as 'dakh'),
      (error: unknown) => {
        assert.ok(error instanceof PublicApiError)
        assert.equal(error.error, 'HOTEL_NOT_FOUND')
        return true
      },
    )
    assert.equal(calls, 0)
  })
})

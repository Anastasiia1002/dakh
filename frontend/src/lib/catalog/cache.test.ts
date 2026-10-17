import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  CATALOG_CACHE_TTL_MS,
  invalidateCatalogCache,
  loadAccommodationList,
  resetCatalogCache,
  setCatalogCacheClock,
  setCatalogLoader,
} from './cache'
import type { PublicAccommodationListResponse, PublicHotelSlug } from '../publicBooking/types'

function list(hotelSlug: PublicHotelSlug): PublicAccommodationListResponse {
  return { hotelSlug, accommodations: [] }
}

afterEach(() => {
  resetCatalogCache()
})

describe('catalog cache', () => {
  it('reuses a list until the TTL expires', async () => {
    let now = 1_000
    let calls = 0
    setCatalogCacheClock(() => now)
    setCatalogLoader(async (hotelSlug) => {
      calls += 1
      return list(hotelSlug)
    })

    await loadAccommodationList('dakh')
    await loadAccommodationList('dakh')
    assert.equal(calls, 1)

    now += CATALOG_CACHE_TTL_MS + 1
    await loadAccommodationList('dakh')
    assert.equal(calls, 2)
  })

  it('deduplicates concurrent requests for the same hotel', async () => {
    let calls = 0
    let release: (value: PublicAccommodationListResponse) => void = () => undefined
    setCatalogLoader(
      (hotelSlug) =>
        new Promise((resolve) => {
          calls += 1
          release = resolve
        }).then(() => list(hotelSlug)),
    )

    const first = loadAccommodationList('dakh')
    const second = loadAccommodationList('dakh')
    release(list('dakh'))
    const [left, right] = await Promise.all([first, second])
    assert.equal(calls, 1)
    assert.equal(left.hotelSlug, 'dakh')
    assert.equal(right.hotelSlug, 'dakh')
  })

  it('fetches again after invalidation and after a failure', async () => {
    let calls = 0
    let fail = true
    setCatalogLoader(async (hotelSlug) => {
      calls += 1
      if (fail) throw new Error('network')
      return list(hotelSlug)
    })

    await assert.rejects(loadAccommodationList('sunny-park'), /network/)
    fail = false
    invalidateCatalogCache('sunny-park')
    const value = await loadAccommodationList('sunny-park')
    assert.equal(value.hotelSlug, 'sunny-park')
    assert.equal(calls, 2)

    await loadAccommodationList('sunny-park')
    assert.equal(calls, 2)
    invalidateCatalogCache('sunny-park')
    await loadAccommodationList('sunny-park', undefined, true)
    assert.equal(calls, 3)
  })

  it('does not cancel a shared request when one caller aborts', async () => {
    let calls = 0
    let sawAbort = false
    let release: () => void = () => undefined
    setCatalogLoader(
      (hotelSlug, signal) =>
        new Promise((resolve, reject) => {
          calls += 1
          signal.addEventListener('abort', () => {
            sawAbort = true
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          })
          release = () => resolve(list(hotelSlug))
        }),
    )

    const first = new AbortController()
    const second = new AbortController()
    const left = loadAccommodationList('dakh', first.signal)
    const right = loadAccommodationList('dakh', second.signal)
    first.abort()
    await assert.rejects(left, (error: unknown) => error instanceof Error && error.name === 'AbortError')
    assert.equal(sawAbort, false)
    release()
    const value = await right
    assert.equal(value.accommodations.length, 0)
    assert.equal(calls, 1)
  })

  it('aborts the request when every caller is gone', async () => {
    let sawAbort = false
    setCatalogLoader(
      (_hotelSlug, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            sawAbort = true
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          })
        }),
    )

    const first = new AbortController()
    const second = new AbortController()
    const left = loadAccommodationList('dakh', first.signal)
    const right = loadAccommodationList('dakh', second.signal)
    first.abort()
    second.abort()
    await assert.rejects(left)
    await assert.rejects(right)
    assert.equal(sawAbort, true)
  })
})

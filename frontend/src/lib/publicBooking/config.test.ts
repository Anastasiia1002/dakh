import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isPublicApiConfigured, resolveHotelSlug, resolvePublicApiBaseUrl, resolveRatePlanId } from './config'

describe('public booking config', () => {
  it('prefers the documented public API base URL', () => {
    assert.equal(
      resolvePublicApiBaseUrl({
        VITE_PUBLIC_API_BASE_URL: 'http://localhost:3000/api/public/v1/',
        VITE_API_BASE_URL: 'http://example.test',
      }),
      'http://localhost:3000/api/public/v1',
    )
  })

  it('appends the public prefix to a host-only VITE_API_BASE_URL', () => {
    assert.equal(
      resolvePublicApiBaseUrl({ VITE_API_BASE_URL: 'http://localhost:3000' }),
      'http://localhost:3000/api/public/v1',
    )
  })

  it('keeps a VITE_API_BASE_URL that already includes the prefix', () => {
    assert.equal(
      resolvePublicApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example/api/public/v1' }),
      'https://api.example/api/public/v1',
    )
  })

  it('reports missing configuration instead of defaulting to localhost', () => {
    assert.equal(resolvePublicApiBaseUrl({}), null)
    assert.equal(isPublicApiConfigured({}), false)
  })

  it('defaults the hotel slug to dakh and does not invent a rate plan id', () => {
    assert.equal(resolveHotelSlug({}), 'dakh')
    assert.equal(resolveHotelSlug({ VITE_PUBLIC_HOTEL_SLUG: ' DAKH ' }), 'dakh')
    assert.equal(resolveRatePlanId({}), null)
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isBookingEnabled,
  isPublicApiConfigured,
  productionApiBaseUrlError,
  resolveHotelSlug,
  resolvePublicApiBaseUrl,
} from './config'
import {
  bookingTargetAllowsWrites,
  isLoopbackPublicApi,
  STAGING_PUBLIC_API_BASE_URL,
  STAGING_QA_PUBLIC_API_BASE_URL,
  stagingApiBaseUrlError,
} from './productionApiUrl'

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

  it('rejects a missing, localhost, or non-https API URL for a production build', () => {
    assert.match(productionApiBaseUrlError(null) ?? '', /required/)
    assert.match(productionApiBaseUrlError('http://localhost:3000/api/public/v1') ?? '', /https/)
    assert.match(productionApiBaseUrlError('https://127.0.0.1/api/public/v1') ?? '', /localhost/)
    assert.match(productionApiBaseUrlError('https://api.example.com/health') ?? '', /api\/public\/v1/)
    assert.equal(productionApiBaseUrlError('https://api.example.com/api/public/v1'), null)
  })

  it('enables booking only for the exact string true', () => {
    assert.equal(isBookingEnabled({}), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: undefined }), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: '' }), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: 'false' }), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: 'TRUE' }), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: '1' }), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: ' true' }), false)
    assert.equal(isBookingEnabled({ VITE_BOOKING_ENABLED: 'true' }), true)
  })

  it('allows booking writes only to local staging unless a production build opts in', () => {
    assert.equal(STAGING_PUBLIC_API_BASE_URL, 'http://localhost:3000/api/public/v1')
    assert.equal(STAGING_QA_PUBLIC_API_BASE_URL, 'http://127.0.0.1:3001/api/public/v1')
    assert.equal(isLoopbackPublicApi('http://localhost:3000/api/public/v1'), true)
    assert.equal(isLoopbackPublicApi('http://127.0.0.1:3000/api/public/v1'), true)
    assert.equal(isLoopbackPublicApi('http://127.0.0.1:3001/api/public/v1'), true)
    assert.equal(stagingApiBaseUrlError('http://127.0.0.1:3001/api/public/v1'), null)
    assert.equal(stagingApiBaseUrlError('https://dakh-staging-api.example/api/public/v1'), null)
    assert.match(stagingApiBaseUrlError('https://dakh-backend.onrender.com/api/public/v1') ?? '', /production Render/)
    assert.equal(isLoopbackPublicApi('https://dakh-backend.onrender.com/api/public/v1'), false)
    assert.equal(isLoopbackPublicApi('http://localhost:5173/api/public/v1'), false)
    assert.equal(bookingTargetAllowsWrites('http://localhost:3000/api/public/v1', false), true)
    assert.equal(bookingTargetAllowsWrites('http://127.0.0.1:3001/api/public/v1', false), true)
    assert.equal(bookingTargetAllowsWrites('https://dakh-backend.onrender.com/api/public/v1', false), false)
    assert.equal(bookingTargetAllowsWrites('https://dakh-backend.onrender.com/api/public/v1', true), true)
    assert.equal(bookingTargetAllowsWrites('https://dakh-staging-api.example/api/public/v1', true), true)
    assert.equal(bookingTargetAllowsWrites('https://dakh-staging-api.example/api/public/v1', false), false)
    assert.equal(bookingTargetAllowsWrites(null, true), false)
    assert.equal(bookingTargetAllowsWrites('http://localhost:3000/api/public/v1', true), true)
    assert.equal(bookingTargetAllowsWrites('not-a-url', true), false)
  })

  it('defaults the hotel slug to dakh', () => {
    assert.equal(resolveHotelSlug({}), 'dakh')
    assert.equal(resolveHotelSlug({ VITE_PUBLIC_HOTEL_SLUG: ' DAKH ' }), 'dakh')
  })
})

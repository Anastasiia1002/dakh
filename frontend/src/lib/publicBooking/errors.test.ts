import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { errorCopy, isAbortError, parseApiError } from './errors'

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

  it('recognizes AbortError so stale requests can be ignored', () => {
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    assert.equal(isAbortError(abortError), true)
    assert.equal(isAbortError(new Error('network')), false)
  })
})

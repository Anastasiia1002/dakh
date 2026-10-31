import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rejectionClearsDates } from './useStayGuard'

describe('stay rejection', () => {
  it('does not erase the selected dates when a quote fails', () => {
    assert.equal(rejectionClearsDates('check-in'), false)
    assert.equal(rejectionClearsDates('range'), false)
    assert.equal(rejectionClearsDates('guests'), false)
  })
})

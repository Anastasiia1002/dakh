import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { adultCountLabel, childCountLabel, guestCountLabel, knownPartySummary, partySummary } from './ukrainian'

describe('Ukrainian guest pluralization', () => {
  it('declines children', () => {
    assert.equal(childCountLabel(1), '1 дитина')
    assert.equal(childCountLabel(2), '2 дитини')
    assert.equal(childCountLabel(3), '3 дитини')
    assert.equal(childCountLabel(4), '4 дитини')
    assert.equal(childCountLabel(5), '5 дітей')
    assert.equal(childCountLabel(11), '11 дітей')
    assert.equal(childCountLabel(12), '12 дітей')
    assert.equal(childCountLabel(14), '14 дітей')
    assert.equal(childCountLabel(21), '21 дитина')
    assert.equal(childCountLabel(22), '22 дитини')
    assert.equal(childCountLabel(25), '25 дітей')
  })

  it('declines adults', () => {
    assert.equal(adultCountLabel(1), '1 дорослий')
    assert.equal(adultCountLabel(2), '2 дорослих')
    assert.equal(adultCountLabel(5), '5 дорослих')
    assert.equal(adultCountLabel(11), '11 дорослих')
    assert.equal(adultCountLabel(21), '21 дорослий')
    assert.equal(adultCountLabel(22), '22 дорослих')
  })

  it('declines a total guest count without changing the number', () => {
    assert.equal(guestCountLabel(1), '1 гість')
    assert.equal(guestCountLabel(2), '2 гості')
    assert.equal(guestCountLabel(5), '5 гостей')
    assert.equal(guestCountLabel(11), '11 гостей')
    assert.equal(guestCountLabel(21), '21 гість')
    assert.equal(partySummary(2, 0), '2 дорослих')
    assert.equal(partySummary(2, 1), '2 дорослих · 1 дитина')
    assert.equal(partySummary(3, 2), '3 дорослих · 2 дітей')
    assert.equal(partySummary(1, 3), '1 дорослий · 3 дітей')
    assert.equal(partySummary(1, 0), '1 дорослий')
    assert.equal(knownPartySummary(2, 1, 3), '2 дорослих · 1 дитина')
    assert.equal(knownPartySummary(2, 0, 2), '2 дорослих')
    assert.equal(knownPartySummary(null, null, 3), null)
    assert.equal(knownPartySummary(1, 0, 3), null)
  })
})

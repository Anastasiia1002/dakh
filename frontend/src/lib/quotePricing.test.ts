import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { lengthStayTermsCopy, quotePriceLines } from './quotePricing'
import type { PublicQuoteResponse } from './publicBooking/types'

const quote: PublicQuoteResponse = {
  checkIn: '2026-12-01',
  checkOut: '2026-12-04',
  guestCount: 2,
  adults: 2,
  children: 0,
  roomTypeId: 'room',
  ratePlanId: 'plan',
  nights: [
    { date: '2026-12-01', price: '4800.00', currency: 'UAH' },
    { date: '2026-12-02', price: '4800.00', currency: 'UAH' },
    { date: '2026-12-03', price: '4800.00', currency: 'UAH' },
  ],
  totalAmount: '12960.00',
  currency: 'UAH',
  quoteToken: 'x'.repeat(24),
  expiresAt: '2026-12-01T12:15:00.000Z',
}

describe('quote price lines', () => {
  it('does not invent a discount when the server omitted amounts', () => {
    const lines = quotePriceLines(quote)
    assert.equal(lines.accommodation, null)
    assert.equal(lines.discount, null)
    assert.equal(lines.discountLabel, null)
    assert.equal(lines.total, '12960.00')
  })

  it('labels a duration discount only from server fields', () => {
    const lines = quotePriceLines({
      ...quote,
      accommodationSubtotal: '14400.00',
      automaticDiscount: '1440.00',
      discountAmount: '1440.00',
      servicesTotal: '0.00',
      appliedSource: 'AUTOMATIC',
      appliedRule: { name: 'Від 3 ночей', minNights: 3, discountValue: '10.00' },
      totalAmount: '12960.00',
    })
    assert.equal(lines.accommodation, '14400.00')
    assert.equal(lines.discount, '1440.00')
    assert.equal(lines.discountLabel, 'Знижка за тривалість 10%')
    assert.equal(lines.extras, '0.00')
  })

  it('hides terms when no length-stay offers are configured', () => {
    assert.deepEqual(lengthStayTermsCopy(undefined, 'ROOM'), [])
    assert.deepEqual(lengthStayTermsCopy([], 'ROOM'), [])
    assert.deepEqual(
      lengthStayTermsCopy(
        [
          { minNights: 3, discountValue: '10.00', kinds: ['ROOM', 'COTTAGE'] },
          { minNights: 7, discountValue: '15.00', kinds: ['ROOM', 'COTTAGE'] },
        ],
        'ROOM',
      ),
      ['від 3 ночей −10%', 'від 7 ночей −15%'],
    )
  })
})

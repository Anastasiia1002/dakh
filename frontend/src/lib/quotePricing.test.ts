import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extraLineDisplay, isGenericStandardPlan, lengthStayTermsCopy, quotePriceLines, quoteSummaryModel } from './quotePricing'
import type { PublicQuoteResponse, PublicQuoteServiceLine } from './publicBooking/types'

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

  it('lists each extra once and does not repeat the extras aggregate', () => {
    const breakfast: PublicQuoteServiceLine = {
      serviceId: 'svc-1',
      name: 'Сніданок',
      quantity: 2,
      unitPrice: '250.00',
      totalPrice: '500.00',
      currency: 'UAH',
      pricing: 'PRICED',
    }
    const transfer: PublicQuoteServiceLine = {
      serviceId: 'svc-2',
      name: 'Трансфер',
      quantity: 1,
      unitPrice: null,
      totalPrice: null,
      currency: 'UAH',
      pricing: 'BY_AGREEMENT',
    }
    const pet: PublicQuoteServiceLine = {
      serviceId: 'svc-3',
      name: 'Проживання з твариною',
      quantity: 1,
      unitPrice: '0.00',
      totalPrice: '0.00',
      currency: 'UAH',
      pricing: 'PRICED',
    }
    const model = quoteSummaryModel({
      ...quote,
      accommodationSubtotal: '9600.00',
      servicesTotal: '500.00',
      services: [breakfast, transfer, pet],
      totalAmount: '10100.00',
    })
    assert.equal(model.accommodationLabel, 'Проживання · 3 ночі')
    assert.equal(model.accommodation, '9600.00')
    assert.equal(model.extras.length, 3)
    assert.equal(model.extras[0]?.display, '500.00')
    assert.equal(model.extras[0]?.label, 'Сніданок · 2')
    assert.equal(model.extras[1]?.display, 'Оплата за домовленістю')
    assert.equal(model.extras[1]?.kind, 'request')
    assert.equal(model.extras[2]?.display, 'Безкоштовно')
    assert.equal(model.total, '10100.00')
    assert.equal(model.hasRequestOnly, true)
    assert.equal(extraLineDisplay({ ...breakfast, totalPrice: null }).kind, 'request')
  })

  it('does not treat a missing amount as free or zero', () => {
    const missing = extraLineDisplay({
      serviceId: 'svc',
      name: 'SPA',
      quantity: 1,
      unitPrice: null,
      totalPrice: null,
      currency: 'UAH',
    })
    assert.equal(missing.kind, 'request')
    assert.equal(missing.amount, null)
    assert.equal(isGenericStandardPlan({ name: 'Стандарт', type: 'STANDARD' }), true)
    assert.equal(isGenericStandardPlan({ name: 'Стандартний', type: 'STANDARD' }), true)
    assert.equal(isGenericStandardPlan({ name: 'Неповернений сніданок', type: 'NON_REFUNDABLE' }), false)
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

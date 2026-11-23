import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BookingReview } from '../../components/booking/BookingReview'
import { BookingSteps } from '../../components/booking/BookingSteps'
import { PriceSummary } from '../../components/booking/PriceSummary'
import type { PublicQuoteResponse } from './types'

const quote: PublicQuoteResponse = {
  checkIn: '2026-12-20',
  checkOut: '2026-12-22',
  guestCount: 2,
  adults: 2,
  children: 0,
  roomTypeId: 'room',
  ratePlanId: 'plan',
  nights: [
    { date: '2026-12-20', price: '4800.00', currency: 'UAH' },
    { date: '2026-12-21', price: '4800.00', currency: 'UAH' },
  ],
  accommodationSubtotal: '9600.00',
  servicesTotal: '500.00',
  discountAmount: '960.00',
  appliedSource: 'AUTOMATIC',
  appliedRule: { name: 'Від 2 ночей', minNights: 2, discountValue: '10.00' },
  services: [
    {
      serviceId: 'svc-1',
      name: 'Сніданок',
      quantity: 2,
      unitPrice: '250.00',
      totalPrice: '500.00',
      currency: 'UAH',
      pricing: 'PRICED',
    },
    {
      serviceId: 'svc-2',
      name: 'Трансфер',
      quantity: 1,
      unitPrice: null,
      totalPrice: null,
      currency: 'UAH',
      pricing: 'BY_AGREEMENT',
    },
    {
      serviceId: 'svc-3',
      name: 'Проживання з твариною',
      quantity: 1,
      unitPrice: '0.00',
      totalPrice: '0.00',
      currency: 'UAH',
      pricing: 'PRICED',
    },
  ],
  totalAmount: '9140.00',
  currency: 'UAH',
  quoteToken: 'x'.repeat(24),
  expiresAt: '2026-12-01T12:15:00.000Z',
}

describe('booking review summary', () => {
  it('shows each charge once and keeps request-only extras out of the total', () => {
    const html = renderToStaticMarkup(createElement(PriceSummary, { quote }))
    assert.equal(html.split('Проживання · 2 ночі').length - 1, 1)
    assert.equal(html.split('Сніданок · 2').length - 1, 1)
    assert.equal(html.split('Додаткові послуги').length - 1, 0)
    assert.match(html, /Оплата за домовленістю/)
    assert.match(html, /Безкоштовно/)
    assert.match(html, /Разом/)
    assert.match(html, /9\s?140/)
    assert.match(html, /Деталі вартості/)
    assert.equal(html.includes('font-display'), false)
  })

  it('lists stay, extras, contacts and a comment on the verification card', () => {
    const html = renderToStaticMarkup(
      createElement(BookingReview, {
        roomName: '1-кімнатний номер для 2-х з балконом на гори №14/2',
        checkIn: '2026-12-20',
        checkOut: '2026-12-22',
        nights: 2,
        adults: 2,
        children: 1,
        extras: [
          { serviceId: 'svc-1', name: 'Сніданок', quantity: 2 },
          { serviceId: 'svc-2', name: 'Трансфер', quantity: 1 },
        ],
        guest: {
          firstName: 'Олена',
          lastName: 'Коваль',
          phone: '+380958180001',
          email: 'guest@example.test',
          comment: 'Пізній заїзд',
        },
        quote,
      }),
    )
    assert.match(html, /1-кімнатний номер для 2-х з балконом на гори №14\/2/)
    assert.match(html, /20 грудня 2026/)
    assert.match(html, /22 грудня 2026/)
    assert.match(html, /2 дорослих/)
    assert.match(html, /1 дитина/)
    assert.match(html, /Сніданок/)
    assert.match(html, /Трансфер/)
    assert.match(html, /Олена Коваль/)
    assert.match(html, /guest@example.test/)
    assert.match(html, /Пізній заїзд/)
    assert.match(html, /Разом/)
  })

  it('shows a compact numbered stepper and hides empty summary sections', () => {
    const steps = renderToStaticMarkup(createElement(BookingSteps, { active: 'extras', roomSelected: true }))
    assert.match(steps, /Дати й гості/)
    assert.match(steps, /Розміщення/)
    assert.match(steps, /Послуги/)
    assert.match(steps, /Контакти/)
    assert.match(steps, /Підтвердження/)
    assert.doesNotMatch(steps, /Змінити/)
    const empty = renderToStaticMarkup(
      createElement(BookingReview, {
        roomName: 'Помешкання',
        checkIn: '',
        checkOut: '',
        nights: 0,
        adults: 2,
        children: 0,
        extras: [],
        guest: { firstName: '', lastName: '', phone: '', email: '', comment: '' },
        quote: null,
      }),
    )
    assert.doesNotMatch(empty, /Розміщення/)
    assert.doesNotMatch(empty, /Проживання/)
    assert.doesNotMatch(empty, /Контакти/)
    assert.doesNotMatch(empty, /Послуги/)
  })
})

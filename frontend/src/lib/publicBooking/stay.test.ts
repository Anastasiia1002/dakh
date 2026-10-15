import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays, todayIso } from '../format'
import type {
  PublicAvailabilityRatePlan,
  PublicAvailabilityResponse,
  PublicAvailabilityRoomType,
  PublicQuoteResponse,
} from './types'
import {
  availabilityMatchesSearch,
  availabilitySearchStatus,
  authoritativeStayTotal,
  canUseAsCheckIn,
  canUseAsCheckOut,
  findRatePlan,
  guestCountOf,
  quoteMatchesSearch,
  rateConditions,
  ratePlanIdForRoom,
  rateTypeLabel,
  selectEligibleRatePlan,
  shouldApplyResponse,
  shouldRequestQuote,
  soleRatePlanId,
  stayIsSearchable,
  stayNights,
} from './stay'

const roomTypeId = '11111111-1111-4111-8111-111111111111'
const ratePlanId = '22222222-2222-4222-8222-222222222222'

const availability: PublicAvailabilityResponse = {
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  currency: 'UAH',
  roomTypes: [],
}

const quote: PublicQuoteResponse = {
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  guestCount: 2,
  roomTypeId,
  ratePlanId,
  nights: [
    { date: '2026-12-01', price: '4800.00', currency: 'UAH' },
    { date: '2026-12-02', price: '4800.00', currency: 'UAH' },
  ],
  totalAmount: '9600.00',
  currency: 'UAH',
  quoteToken: 'x'.repeat(24),
  expiresAt: '2026-12-01T12:15:00.000Z',
}

describe('stay helpers', () => {
  it('clamps guestCount to the public API bounds', () => {
    assert.equal(guestCountOf(0, 0), 1)
    assert.equal(guestCountOf(2, 1), 3)
    assert.equal(guestCountOf(18, 8), 20)
  })

  it('accepts a 1–30 night stay and rejects a 31st night', () => {
    assert.equal(stayNights('2026-12-01', '2026-12-02'), 1)
    assert.equal(stayIsSearchable('2026-12-01', '2026-12-31', 2), true)
    assert.equal(stayIsSearchable('2026-12-01', '2027-01-01', 2), false)
    assert.equal(stayIsSearchable('2026-12-03', '2026-12-01', 2), false)
  })

  it('blocks past check-in dates and overlong check-out dates', () => {
    const today = todayIso()
    assert.equal(canUseAsCheckIn(today), true)
    assert.equal(canUseAsCheckIn(addDays(today, -1)), false)
    assert.equal(canUseAsCheckOut(today, addDays(today, 30)), true)
    assert.equal(canUseAsCheckOut(today, addDays(today, 31)), false)
  })

  it('applies a response only when it still matches the latest request key', () => {
    assert.equal(shouldApplyResponse('2026-12-01|2026-12-03|2', '2026-12-01|2026-12-03|2'), true)
    assert.equal(shouldApplyResponse('2026-12-01|2026-12-03|2', '2026-12-04|2026-12-06|2'), false)
    assert.equal(shouldApplyResponse('', '2026-12-01|2026-12-03|2'), false)
  })

  it('keeps availability bound to the requested dates', () => {
    assert.equal(
      availabilityMatchesSearch(availability, { checkIn: '2026-12-01', checkOut: '2026-12-03', guestCount: 2 }),
      true,
    )
    assert.equal(
      availabilityMatchesSearch(availability, { checkIn: '2026-12-04', checkOut: '2026-12-06', guestCount: 2 }),
      false,
    )
  })

  it('keeps a quote bound to dates, guests, room type and rate plan', () => {
    const search = {
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      guestCount: 2,
      roomTypeId,
      ratePlanId,
    }
    assert.equal(quoteMatchesSearch(quote, search), true)
    assert.equal(quoteMatchesSearch(quote, { ...search, guestCount: 3 }), false)
    assert.equal(quoteMatchesSearch(quote, { ...search, roomTypeId: 'other-room' }), false)
    assert.equal(quoteMatchesSearch(quote, { ...search, ratePlanId: 'other-plan' }), false)
    assert.equal(quoteMatchesSearch(quote, { ...search, ratePlanId: null }), false)
    assert.equal(quoteMatchesSearch(quote, { ...search, checkOut: '2026-12-04' }), false)
  })

  it('selects a sole plan, keeps an applicable plan, and clears an empty or stale plan', () => {
    const cheap: PublicAvailabilityRatePlan = {
      ratePlanId,
      name: 'Неповернений',
      type: 'NON_REFUNDABLE',
      nightlyStartingPrice: '4500.00',
      totalAmount: '9000.00',
      currency: 'UAH',
    }
    const standard: PublicAvailabilityRatePlan = {
      ratePlanId: '33333333-3333-4333-8333-333333333333',
      name: 'Стандарт',
      type: 'STANDARD',
      nightlyStartingPrice: '4800.00',
      totalAmount: '9600.00',
      currency: 'UAH',
    }
    const onePlan: PublicAvailabilityRoomType = {
      roomTypeId,
      name: 'Тестова кімната',
      kind: 'ROOM',
      maxGuests: 2,
      availableCount: 1,
      nightlyStartingPrice: '4500.00',
      currency: 'UAH',
      ratePlans: [cheap],
    }
    const manyPlans = { ...onePlan, ratePlans: [cheap, standard] }
    const noPlans = { ...onePlan, nightlyStartingPrice: null, ratePlans: [] }

    assert.equal(soleRatePlanId(onePlan), ratePlanId)
    assert.equal(soleRatePlanId(manyPlans), '')
    assert.equal(soleRatePlanId(noPlans), '')
    assert.equal(ratePlanIdForRoom(onePlan, ''), ratePlanId)
    assert.equal(ratePlanIdForRoom(manyPlans, ''), ratePlanId)
    assert.equal(ratePlanIdForRoom(manyPlans, standard.ratePlanId), ratePlanId)
    assert.equal(selectEligibleRatePlan([standard, cheap])?.ratePlanId, ratePlanId)
    assert.equal(rateConditions('NON_REFUNDABLE'), 'Неповернений тариф: у разі скасування оплата не повертається.')
    assert.equal(ratePlanIdForRoom(noPlans, ratePlanId), '')
    assert.equal(findRatePlan(manyPlans, standard.ratePlanId)?.name, 'Стандарт')
    assert.equal(findRatePlan(onePlan, standard.ratePlanId), undefined)
    assert.equal(rateTypeLabel('NON_REFUNDABLE'), 'Неповернений')
    assert.equal(rateTypeLabel('STANDARD'), 'Стандарт')
    assert.equal(rateTypeLabel('SPECIAL'), 'Спеціальний')
  })

  it('uses the rate-plan total and does not invent one from a nightly starting price', () => {
    assert.equal(authoritativeStayTotal({ totalAmount: '200.00', currency: 'UAH' }), '200.00')
    assert.equal(authoritativeStayTotal({ totalAmount: '100', currency: 'UAH' }), null)
    assert.equal(authoritativeStayTotal({ totalAmount: '200.00', currency: 'EUR' }), null)
    assert.equal(authoritativeStayTotal(null), null)
    assert.equal(selectEligibleRatePlan([]), null)
  })

  it('treats an empty availability list as emptiness and a failed request as an error', () => {
    assert.equal(
      availabilitySearchStatus({ searchable: true, configured: true, settled: true, error: '', roomCount: 0 }),
      'empty',
    )
    assert.equal(
      availabilitySearchStatus({
        searchable: true,
        configured: true,
        settled: true,
        error: 'Не вдалося зв’язатися з сервером бронювання.',
        roomCount: 0,
      }),
      'error',
    )
    assert.equal(
      availabilitySearchStatus({ searchable: true, configured: true, settled: false, error: '', roomCount: 0 }),
      'loading',
    )
  })

  it('does not request a quote unless booking is explicitly enabled', () => {
    assert.equal(shouldRequestQuote(false, '2026-12-15|2026-12-17|2|room|plan'), false)
    assert.equal(shouldRequestQuote(true, ''), false)
    assert.equal(shouldRequestQuote(true, '2026-12-15|2026-12-17|2|room|plan'), true)
  })
})

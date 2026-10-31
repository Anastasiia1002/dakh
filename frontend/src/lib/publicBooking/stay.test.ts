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
  CAPACITY_BLOCK_COPY,
  canUseAsCheckIn,
  canUseAsCheckOut,
  findRatePlan,
  guestComposition,
  guestCountOf,
  guestDraftFromParams,
  intentStayFromQuote,
  publicQuoteBody,
  quoteRequestKey,
  MISSING_PUBLIC_PRICE_COPY,
  isDemoNightlyAmount,
  isDemoQuotedStay,
  isDemoRate,
  isDemoStayTotal,
  offerableRatePlans,
  quoteMatchesSearch,
  rateConditions,
  ratePlanIdForRoom,
  rateTypeLabel,
  roomAcceptsGuestCount,
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
  adults: 2,
  children: 0,
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
  it('keeps adults and children as a sum and rejects an invalid split', () => {
    assert.deepEqual(guestComposition(1, 1), { adults: 1, children: 1, guestCount: 2 })
    assert.deepEqual(guestComposition(2, 0), { adults: 2, children: 0, guestCount: 2 })
    assert.deepEqual(guestComposition(2, 1), { adults: 2, children: 1, guestCount: 3 })
    assert.deepEqual(guestComposition(2, 2), { adults: 2, children: 2, guestCount: 4 })
    assert.equal(guestCountOf(1, 1), 2)
    assert.equal(guestCountOf(2, 0), 2)
    assert.equal(guestCountOf(2, 2), 4)
    assert.equal(guestComposition(0, 2), null)
    assert.equal(guestComposition(2, -1), null)
    assert.equal(guestComposition(1.5, 0.5), null)
    assert.equal(guestComposition(18, 8), null)
    assert.equal(guestComposition(3, 1, 2), null)
    assert.equal(guestCountOf(0, 0), 0)
    assert.equal(guestCountOf(18, 8), 0)
    assert.deepEqual(guestDraftFromParams('1', '1'), { adults: 1, children: 1, guestCount: 2 })
    assert.deepEqual(guestDraftFromParams('0', '2'), { adults: 2, children: 2, guestCount: 4 })
    assert.deepEqual(guestDraftFromParams('18', '8'), { adults: 2, children: 0, guestCount: 2 })
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
    assert.equal(shouldApplyResponse('dakh|2026-12-01|2026-12-03|2', 'dakh|2026-12-01|2026-12-03|3'), false)
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
    assert.equal(quoteMatchesSearch(quote, { ...search, adults: 1, children: 1 }), false)
    assert.equal(quoteMatchesSearch({ ...quote, adults: 1, children: 1 }, { ...search, adults: 1, children: 1 }), true)
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

  it('rejects inverted dates, a same-day stay, and a stay longer than 30 nights', () => {
    assert.equal(stayIsSearchable('2026-12-03', '2026-12-01', 2), false)
    assert.equal(stayIsSearchable('2026-12-01', '2026-12-01', 2), false)
    assert.equal(stayIsSearchable('2026-12-01', '2027-02-01', 2), false)
    assert.equal(stayIsSearchable('2026-12-01', '2026-12-03', 2), true)
    assert.equal(stayIsSearchable('not-a-date', '2026-12-03', 2), false)
  })

  it('blocks a room that cannot hold the guest count', () => {
    assert.equal(roomAcceptsGuestCount({ maxGuests: 2 }, 2), true)
    assert.equal(roomAcceptsGuestCount({ maxGuests: 2 }, 3), false)
    assert.equal(roomAcceptsGuestCount(undefined, 2), false)
    assert.equal(CAPACITY_BLOCK_COPY.length > 0, true)
  })

  it('drops the staging test tariff and refuses to quote without a public price', () => {
    const real = {
      ratePlanId,
      name: 'Стандарт',
      type: 'STANDARD' as const,
      nightlyStartingPrice: '4800.00',
      totalAmount: '9600.00',
      currency: 'UAH' as const,
    }
    const testPlan = {
      ...real,
      ratePlanId: '44444444-4444-4444-8444-444444444444',
      name: 'TEST',
      code: 'catalog-test-100',
      totalAmount: '100.00',
      nightlyStartingPrice: '100.00',
    }
    assert.deepEqual(offerableRatePlans([testPlan, real]).map((plan) => plan.ratePlanId), [ratePlanId])
    assert.deepEqual(offerableRatePlans([testPlan]), [])
    assert.equal(shouldRequestQuote(true, ''), false)
    assert.equal(MISSING_PUBLIC_PRICE_COPY.includes('Публічної ціни'), true)
  })

  it('labels only the 2000 UAH nightly rate as a demonstration price', () => {
    assert.equal(isDemoNightlyAmount('2000.00'), true)
    assert.equal(isDemoNightlyAmount('2000'), true)
    assert.equal(isDemoNightlyAmount('2000.0'), true)
    assert.equal(isDemoNightlyAmount('4800.00'), false)
    assert.equal(isDemoNightlyAmount('2000.01'), false)
    assert.equal(isDemoNightlyAmount('12000.00'), false)
    assert.equal(isDemoRate({ name: 'Стандарт', nightlyStartingPrice: '2000.00' }), true)
    assert.equal(isDemoRate({ name: 'Стандарт', nightlyStartingPrice: '4800.00' }), false)
    assert.equal(isDemoQuotedStay([{ price: '2000.00' }, { price: '2000.00' }]), true)
    assert.equal(isDemoQuotedStay([{ price: '2000.00' }, { price: '4800.00' }]), false)
    assert.equal(isDemoStayTotal('4000.00', 2), true)
    assert.equal(isDemoStayTotal('2000.00', 1), true)
    assert.equal(isDemoStayTotal('9600.00', 2), false)
  })

  it('does not request a quote unless booking is explicitly enabled', () => {
    assert.equal(shouldRequestQuote(false, '2026-12-15|2026-12-17|2|room|plan'), false)
    assert.equal(shouldRequestQuote(true, ''), false)
    assert.equal(shouldRequestQuote(true, '2026-12-15|2026-12-17|2|room|plan'), true)
  })

  it('sends the same adult and child split on the quote and the intent', () => {
    const quoteBody = publicQuoteBody({
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      adults: 2,
      children: 2,
      roomTypeId,
      ratePlanId,
    })
    assert.deepEqual(quoteBody, {
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      guestCount: 4,
      adults: 2,
      children: 2,
      roomTypeId,
      ratePlanId,
    })
    assert.equal(quoteBody && 'discountAmount' in quoteBody, false)
    const twoAdults = publicQuoteBody({
      checkIn: '2026-11-10',
      checkOut: '2026-11-13',
      adults: 2,
      children: 0,
      roomTypeId,
      ratePlanId,
    })
    const withChild = publicQuoteBody({
      checkIn: '2026-11-10',
      checkOut: '2026-11-13',
      adults: 2,
      children: 1,
      roomTypeId,
      ratePlanId,
    })
    assert.equal(twoAdults?.guestCount, 2)
    assert.equal(withChild?.guestCount, 3)
    assert.equal(twoAdults && 'totalAmount' in twoAdults, false)
    assert.equal(withChild && 'totalAmount' in withChild, false)
    assert.equal(publicQuoteBody({ ...quoteBody!, adults: 0, children: 4 }), null)
    const issued = { ...quote, guestCount: 4, adults: 2, children: 2, totalAmount: '9600.00' }
    assert.deepEqual(intentStayFromQuote(issued), { adults: 2, children: 2, guestCount: 4 })
    assert.equal(intentStayFromQuote({ ...issued, children: 1 }), null)
    assert.equal(issued.totalAmount, '9600.00')
  })

  it('drops a quote when the guest split changes even if the total count stays the same', () => {
    const shared = {
      hotel: 'dakh',
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      roomTypeId,
      ratePlanId,
      kind: 'ROOM',
    }
    const twoAdults = quoteRequestKey({ ...shared, adults: 2, children: 0 })
    const oneChild = quoteRequestKey({ ...shared, adults: 1, children: 1 })
    assert.notEqual(twoAdults, oneChild)
    assert.equal(twoAdults.includes('|2|2|0|'), true)
    assert.equal(oneChild.includes('|2|1|1|'), true)
    assert.equal(quoteRequestKey({ ...shared, adults: 0, children: 2 }), '')
  })
})

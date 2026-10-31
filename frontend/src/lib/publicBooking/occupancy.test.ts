import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PublicBookingClient } from './client'
import {
  calendarMatchesParty,
  calendarRejectsStay,
  canStartCheckIn,
  capacityExplanation,
  reconcileStay,
} from './calendar'
import { stayRejection, STAY_GUESTS_COPY, STAY_RANGE_COPY } from './errors'
import { parseApiError } from './errors'
import { handoffToSearch, parseBookingHandoff } from './handoff'
import { rejectionClearsDates } from './useStayGuard'
import {
  availabilityQueryFromParty,
  calendarQueryFromParty,
  guestComposition,
  intentStayFromQuote,
  publicQuoteBody,
  quoteMatchesSearch,
  quoteRequestKey,
  roomAcceptsAdults,
  roomSelectionAfterStayPatch,
} from './stay'
import type { PublicCalendarDay, PublicCalendarRoomType, PublicQuoteResponse } from './types'

const roomTypeId = '11111111-1111-4111-8111-111111111111'
const ratePlanId = '22222222-2222-4222-8222-222222222222'
const stay = { checkIn: '2026-12-10', checkOut: '2026-12-12', roomTypeId, ratePlanId }

function fits(adults: number, children: number, maxGuests = 2) {
  const split = guestComposition(adults, children, maxGuests)
  return split !== null && roomAcceptsAdults({ maxGuests }, adults)
}

describe('adult occupancy', () => {
  it('sends adults, children, and the total on availability and calendar', () => {
    assert.deepEqual(
      availabilityQueryFromParty({ ...stay, adults: 2, children: 2, kind: 'ROOM' }),
      {
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guestCount: 4,
        adults: 2,
        children: 2,
        roomTypeId,
        kind: 'ROOM',
      },
    )
    assert.deepEqual(calendarQueryFromParty({ from: '2026-12-01', to: '2027-01-01', adults: 2, children: 1 }), {
      from: '2026-12-01',
      to: '2027-01-01',
      guestCount: 3,
      adults: 2,
      children: 1,
    })
    assert.equal(availabilityQueryFromParty({ ...stay, adults: 0, children: 2 }), null)
  })

  it('keeps a 2-person room for two adults with or without children', () => {
    assert.equal(fits(2, 0), true)
    assert.equal(fits(2, 1), true)
    assert.equal(fits(2, 2), true)
    assert.equal(fits(3, 0), false)
    assert.equal(fits(3, 1), false)
    assert.equal(guestComposition(2, 2)?.guestCount, 4)
  })

  it('keeps the selected room and dates when only children change', () => {
    const current = { roomTypeId, ratePlanId }
    assert.deepEqual(
      roomSelectionAfterStayPatch({ locked: false, ...current, next: { children: 2 } }),
      current,
    )
    assert.deepEqual(
      roomSelectionAfterStayPatch({ locked: true, ...current, next: { children: 1 } }),
      current,
    )
    assert.deepEqual(
      roomSelectionAfterStayPatch({ locked: false, ...current, next: { adults: 3 } }),
      { roomTypeId: '', ratePlanId: '' },
    )
    const dates = { checkIn: '2026-12-10', checkOut: '2026-12-12' }
    assert.deepEqual(
      reconcileStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: {
          '2026-12-10': { date: '2026-12-10', status: 'available', availableCount: 1, reason: null },
          '2026-12-11': { date: '2026-12-11', status: 'available', availableCount: 1, reason: null },
          '2026-12-12': { date: '2026-12-12', status: 'available', availableCount: 1, reason: null },
        },
        ...dates,
        roomScoped: true,
      }),
      dates,
    )
  })

  it('does not invent a price from the child count', () => {
    const twoAdults = publicQuoteBody({ ...stay, adults: 2, children: 0 })
    const twoChildren = publicQuoteBody({ ...stay, adults: 2, children: 2 })
    assert.ok(twoAdults && twoChildren)
    assert.equal(twoAdults.guestCount, 2)
    assert.equal(twoChildren.guestCount, 4)
    assert.equal(twoAdults.roomTypeId, twoChildren.roomTypeId)
    assert.equal(twoAdults.ratePlanId, twoChildren.ratePlanId)
    assert.equal('totalAmount' in twoAdults, false)
    assert.equal('totalAmount' in twoChildren, false)
  })

  it('rejects a quote whose split does not match the search', () => {
    const shared = { hotel: 'dakh', ...stay }
    const adultsOnly = quoteRequestKey({ ...shared, adults: 2, children: 0 })
    const withChildren = quoteRequestKey({ ...shared, adults: 2, children: 2 })
    assert.notEqual(adultsOnly, withChildren)
    const quote = {
      ...stay,
      guestCount: 2,
      adults: 2,
      children: 0,
      nights: [],
      totalAmount: '200.00',
      currency: 'UAH' as const,
      quoteToken: 'token-token-token-token',
      expiresAt: '2026-12-01T00:00:00.000Z',
    } satisfies PublicQuoteResponse
    assert.equal(
      quoteMatchesSearch(quote, { checkIn: stay.checkIn, checkOut: stay.checkOut, guestCount: 4, adults: 2, children: 2, roomTypeId, ratePlanId }),
      false,
    )
    assert.deepEqual(intentStayFromQuote({ ...quote, guestCount: 4, adults: 2, children: 2 }), {
      adults: 2,
      children: 2,
      guestCount: 4,
    })
    assert.equal(intentStayFromQuote({ ...quote, guestCount: 3, adults: 2, children: 2 }), null)
  })

  it('uses occupancyCount as the adult filter and leaves a sold-out night unavailable', () => {
    assert.equal(
      calendarMatchesParty({ guestCount: 4, occupancyCount: 2 }, { adults: 2, children: 2, guestCount: 4 }),
      true,
    )
    assert.equal(
      calendarMatchesParty({ guestCount: 4, occupancyCount: 4 }, { adults: 2, children: 2, guestCount: 4 }),
      false,
    )
    assert.equal(calendarMatchesParty({ guestCount: 4, occupancyCount: null }, { adults: 2, children: 2, guestCount: 4 }), false)
    const booked: PublicCalendarDay = {
      date: '2026-12-10',
      status: 'booked',
      availableCount: 0,
      reason: 'booking',
    }
    const room: PublicCalendarRoomType = {
      roomTypeId,
      slug: 'bukovyna',
      name: 'Буковина',
      kind: 'ROOM',
      maxGuests: 2,
      days: [booked],
    }
    assert.equal(capacityExplanation([room], roomTypeId), '')
    assert.equal(canStartCheckIn('ready', '2026-12-01', { '2026-12-10': booked }, '2026-12-10'), false)
    assert.equal(
      calendarRejectsStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: { '2026-12-10': booked, '2026-12-11': booked, '2026-12-12': booked },
        checkIn: '2026-12-10',
        checkOut: '2026-12-12',
      }),
      true,
    )
  })

  it('keeps a guest-capacity error understandable and does not clear the dates', () => {
    const legacy = parseApiError(400, {
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Некоректні дані запиту',
      details: ['guestCount: перевищує місткість категорії'],
    })
    const adults = parseApiError(400, {
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Некоректні дані запиту',
      details: ['adults: перевищує місткість категорії', 'guestCount: перевищує місткість категорії'],
    })
    assert.equal(stayRejection(legacy)?.kind, 'guests')
    assert.equal(stayRejection(legacy)?.message, STAY_GUESTS_COPY)
    assert.equal(stayRejection(adults)?.message, STAY_GUESTS_COPY)
    assert.equal(rejectionClearsDates('guests'), false)
    assert.notEqual(stayRejection(adults)?.message, STAY_RANGE_COPY)
  })

  it('hands a 2-adult 2-child stay from a room page without collapsing the split', () => {
    const handoff = {
      hotelSlug: 'dakh',
      catalogSlug: 'bukovyna',
      roomTypeId,
      roomTypeSlug: 'bukovyna',
      checkIn: '2026-12-10',
      checkOut: '2026-12-12',
      adults: 2,
      children: 2,
      ratePlanId,
      preview: { totalAmount: '200.00', currency: 'UAH' as const },
    }
    const parsed = parseBookingHandoff(handoff)
    assert.equal(parsed?.adults, 2)
    assert.equal(parsed?.children, 2)
    const params = handoffToSearch(handoff)
    assert.equal(params.get('adults'), '2')
    assert.equal(params.get('children'), '2')
    assert.equal(params.get('guestCount'), null)
  })

  it('still serializes a legacy guestCount-only search and does not post a booking', async () => {
    const calls: string[] = []
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push(`${init?.method ?? 'GET'} ${String(input)}`)
      return new Response(JSON.stringify({ checkIn: '2026-12-10', checkOut: '2026-12-12', currency: 'UAH', roomTypes: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const client = new PublicBookingClient({
      baseUrl: 'http://127.0.0.1:9/api/public/v1',
      hotelSlug: 'dakh',
      fetch: fetchMock,
      writesEnabled: false,
    })
    await client.availability({ checkIn: '2026-12-10', checkOut: '2026-12-12', guestCount: 2 })
    assert.match(calls[0] ?? '', /guestCount=2/)
    assert.doesNotMatch(calls[0] ?? '', /adults=/)
    await assert.rejects(() => client.quote(publicQuoteBody({ ...stay, adults: 2, children: 2 })!), /BOOKING_DISABLED/)
    assert.equal(calls.length, 1)
  })
})

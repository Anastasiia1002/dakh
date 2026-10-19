import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calendarRejectsStay,
  canFinishCheckOut,
  canStartCheckIn,
  dayAriaLabel,
  dayStatusCopy,
  dayVisual,
  indexCalendarDays,
  reconcileStay,
  selectionAfterStayRejection,
  stayKey,
  visibleCalendarRange,
} from './calendar'
import type { PublicCalendarDay, PublicCalendarRoomType } from './types'

const roomId = '11111111-1111-4111-8111-111111111111'
const otherId = '22222222-2222-4222-8222-222222222222'

function day(date: string, status: PublicCalendarDay['status'], availableCount = status === 'available' ? 1 : 0, reason: PublicCalendarDay['reason'] = null): PublicCalendarDay {
  return { date, status, availableCount, reason }
}

function room(id: string, days: PublicCalendarDay[], maxGuests = 2): PublicCalendarRoomType {
  return {
    roomTypeId: id,
    slug: id === roomId ? 'e2e-bukovyna' : 'e2e-goryshche',
    name: id === roomId ? 'E2E Bukovyna' : 'E2E Goryshche',
    kind: 'ROOM',
    maxGuests,
    days,
  }
}

const readyDays = indexCalendarDays(
  [
    room(roomId, [
      day('2026-12-20', 'available', 1),
      day('2026-12-21', 'booked', 0, 'booking'),
      day('2026-12-22', 'available', 1),
      day('2026-12-23', 'restricted', 1, 'rate'),
    ]),
  ],
  roomId,
)

describe('availability calendar', () => {
  it('requests the two visible months as one half-open range', () => {
    assert.deepEqual(visibleCalendarRange(2026, 11), { from: '2026-12-01', to: '2027-02-01' })
    assert.deepEqual(visibleCalendarRange(2026, 6), { from: '2026-07-01', to: '2026-09-01' })
  })

  it('treats partial inventory as available and a zero count as unavailable', () => {
    const days = indexCalendarDays(
      [room(roomId, [day('2026-12-20', 'available', 1), day('2026-12-21', 'booked', 0, 'block')])],
      roomId,
    )
    assert.equal(days['2026-12-20']?.status, 'available')
    assert.equal(days['2026-12-20']?.availableCount, 1)
    assert.equal(canStartCheckIn('ready', '2026-12-01', days, '2026-12-20'), true)
    assert.equal(canStartCheckIn('ready', '2026-12-01', days, '2026-12-21'), false)
  })

  it('lets checkout fall on the morning another stay begins', () => {
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-20', '2026-12-21'), true)
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-20', '2026-12-22'), false)
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-22', '2026-12-23'), true)
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-22', '2026-12-24'), false)
    assert.equal(canStartCheckIn('ready', '2026-12-01', readyDays, '2026-12-22'), true)
  })

  it('rejects past dates and does not treat loading or errors as free', () => {
    assert.equal(dayVisual('ready', '2026-12-21', readyDays, '2026-12-20'), 'past')
    assert.equal(canStartCheckIn('ready', '2026-12-21', readyDays, '2026-12-20'), false)
    assert.equal(dayVisual('loading', '2026-12-01', readyDays, '2026-12-20'), 'unknown')
    assert.equal(dayVisual('error', null, {}, '2026-12-20'), 'unknown')
    assert.equal(canStartCheckIn('loading', '2026-12-01', readyDays, '2026-12-20'), false)
    assert.equal(canStartCheckIn('error', '2026-12-01', readyDays, '2026-12-20'), false)
    assert.equal(canFinishCheckOut('error', '2026-12-01', readyDays, '2026-12-20', '2026-12-21'), false)
  })

  it('selects a valid stay and clears a stay that crosses an unavailable night', () => {
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-22', '2026-12-23'), true)
    assert.deepEqual(
      reconcileStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: readyDays,
        checkIn: '2026-12-20',
        checkOut: '2026-12-22',
      }),
      { checkIn: '2026-12-20', checkOut: '' },
    )
    assert.deepEqual(
      reconcileStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: readyDays,
        checkIn: '2026-12-22',
        checkOut: '2026-12-23',
      }),
      { checkIn: '2026-12-22', checkOut: '2026-12-23' },
    )
  })

  it('keeps a selected stay while the calendar is loading or the night is outside the loaded month', () => {
    assert.deepEqual(
      reconcileStay({
        status: 'loading',
        hotelToday: null,
        days: {},
        checkIn: '2026-12-20',
        checkOut: '2026-12-22',
      }),
      { checkIn: '2026-12-20', checkOut: '2026-12-22' },
    )
    assert.deepEqual(
      reconcileStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: readyDays,
        checkIn: '2027-03-01',
        checkOut: '2027-03-03',
      }),
      { checkIn: '2027-03-01', checkOut: '2027-03-03' },
    )
  })

  it('follows the selected room when guest count makes only that room restricted', () => {
    const days = indexCalendarDays(
      [
        room(roomId, [day('2026-12-20', 'restricted', 2, 'occupancy')]),
        room(otherId, [day('2026-12-20', 'available', 1)]),
      ],
      roomId,
    )
    const anyRoom = indexCalendarDays(
      [
        room(roomId, [day('2026-12-20', 'restricted', 2, 'occupancy')]),
        room(otherId, [day('2026-12-20', 'available', 1)]),
      ],
      '',
    )
    assert.equal(days['2026-12-20']?.status, 'restricted')
    assert.equal(anyRoom['2026-12-20']?.status, 'available')
    assert.equal(canStartCheckIn('ready', '2026-12-01', days, '2026-12-20'), false)
    assert.equal(canStartCheckIn('ready', '2026-12-01', anyRoom, '2026-12-20'), true)
  })

  it('puts the full date and status in the accessible name', () => {
    const label = dayAriaLabel('2026-12-21', 'booked', true)
    assert.match(label, /21/)
    assert.match(label, /грудня/)
    assert.match(label, /2026/)
    assert.match(label, /немає вільних місць/)
    assert.match(label, /дату виїзду/)
    assert.equal(dayAriaLabel('2026-12-20', 'unknown').includes('вільно'), false)
  })

  it('explains restricted dates in Ukrainian and keeps them unselectable', () => {
    assert.equal(dayStatusCopy('restricted', 'rate'), 'На цю дату немає доступного тарифу')
    assert.equal(dayStatusCopy('restricted', 'occupancy'), 'Кімната не підходить для вибраної кількості гостей')
    assert.equal(dayStatusCopy('closed', 'inactive'), 'Кімната тимчасово недоступна')
    assert.equal(canStartCheckIn('ready', '2026-12-01', readyDays, '2026-12-23'), false)
    assert.match(dayAriaLabel('2026-12-23', 'restricted', false, 'rate'), /немає доступного тарифу/)
    assert.equal(dayStatusCopy('restricted', 'rate').toLowerCase().includes('restricted'), false)
  })

  it('blocks a check-in the server already rejected and a range that cannot be quoted', () => {
    const blocked = new Set(['2026-12-20'])
    const ranges = new Set([stayKey('2026-12-22', '2026-12-23')])
    assert.equal(canStartCheckIn('ready', '2026-12-01', readyDays, '2026-12-20', blocked), false)
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-22', '2026-12-23', ranges), false)
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-22', '2026-12-24', ranges), false)
    assert.deepEqual(
      selectionAfterStayRejection(
        { kind: 'check-in', checkIn: '2026-12-20', checkOut: '2026-12-21' },
        new Set(),
        new Set(),
      ),
      {
        checkIn: '',
        checkOut: '',
        blockedCheckIns: new Set(['2026-12-20']),
        blockedRanges: new Set(),
      },
    )
    assert.deepEqual(
      reconcileStay({
        status: 'loading',
        hotelToday: null,
        days: {},
        checkIn: '2026-12-20',
        checkOut: '2026-12-21',
        blockedCheckIns: new Set(['2026-12-20']),
      }),
      { checkIn: '', checkOut: '' },
    )
  })

  it('rejects a stay that crosses an occupied night, is in the past, or exceeds 30 nights', () => {
    assert.equal(
      calendarRejectsStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: readyDays,
        checkIn: '2026-12-20',
        checkOut: '2026-12-23',
      }),
      true,
    )
    assert.equal(
      calendarRejectsStay({
        status: 'ready',
        hotelToday: '2026-12-21',
        days: readyDays,
        checkIn: '2026-12-20',
        checkOut: '2026-12-21',
      }),
      true,
    )
    assert.equal(
      calendarRejectsStay({
        status: 'loading',
        hotelToday: null,
        days: {},
        checkIn: '2026-12-01',
        checkOut: '2027-01-15',
      }),
      true,
    )
    assert.equal(
      calendarRejectsStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: readyDays,
        checkIn: '2026-12-22',
        checkOut: '2026-12-23',
      }),
      false,
    )
  })

  it('does not turn one rejected minimum stay into a rule for other dates', () => {
    const next = selectionAfterStayRejection(
      { kind: 'range', checkIn: '2026-12-22', checkOut: '2026-12-23' },
      new Set(),
      new Set(),
    )
    assert.equal(next.blockedRanges.has('2026-12-22|2026-12-23'), true)
    assert.equal(canStartCheckIn('ready', '2026-12-01', readyDays, '2026-12-22', next.blockedCheckIns), true)
    assert.equal(canFinishCheckOut('ready', '2026-12-01', readyDays, '2026-12-22', '2026-12-23', next.blockedRanges), false)
  })

  it('does not clear a valid check-in when only checkout is still empty', () => {
    assert.deepEqual(
      reconcileStay({
        status: 'ready',
        hotelToday: '2026-12-01',
        days: readyDays,
        checkIn: '2026-12-22',
        checkOut: '',
      }),
      { checkIn: '2026-12-22', checkOut: '' },
    )
  })

  it('keeps same-day check-in when the hotel window and the night are both open', () => {
    const days = indexCalendarDays(
      [
        room(roomId, [
          eligible('2026-10-19', 'available', { checkoutEligible: false }),
          eligible('2026-10-20', 'available'),
        ]),
      ],
      roomId,
    )
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-19', undefined, '2026-10-19'), true)
    assert.equal(canFinishCheckOut('ready', '2026-10-19', days, '2026-10-19', '2026-10-20', undefined, '2026-10-19'), true)
    assert.equal(canFinishCheckOut('ready', '2026-10-19', days, '2026-10-19', '2026-10-19', undefined, '2026-10-19'), false)
    assert.equal(
      calendarRejectsStay({
        status: 'ready',
        hotelToday: '2026-10-19',
        earliestCheckIn: '2026-10-19',
        days,
        checkIn: '2026-10-19',
        checkOut: '2026-10-20',
      }),
      false,
    )
  })

  it('does not start a stay on an occupied night even when the window would allow it', () => {
    const days = indexCalendarDays(
      [
        room(roomId, [
          eligible('2026-10-19', 'booked', { reason: 'booking', checkInEligible: true, checkoutEligible: false, availableCount: 0 }),
          eligible('2026-10-20', 'available', { checkoutEligible: true }),
        ]),
      ],
      roomId,
    )
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-19', undefined, '2026-10-19'), false)
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-20', undefined, '2026-10-19'), true)
    assert.equal(
      calendarRejectsStay({
        status: 'ready',
        hotelToday: '2026-10-19',
        earliestCheckIn: '2026-10-19',
        days,
        checkIn: '2026-10-19',
        checkOut: '2026-10-20',
      }),
      true,
    )
  })

  it('allows checkout on a booked morning and rejects a morning the window cannot end', () => {
    const bookedMorning = indexCalendarDays(
      [
        room(roomId, [
          eligible('2026-10-20', 'available'),
          eligible('2026-10-21', 'booked', { reason: 'booking', checkInEligible: true, checkoutEligible: true, availableCount: 0 }),
        ]),
      ],
      roomId,
    )
    assert.equal(canFinishCheckOut('ready', '2026-10-19', bookedMorning, '2026-10-20', '2026-10-21', undefined, '2026-10-19'), true)
    assert.equal(canStartCheckIn('ready', '2026-10-19', bookedMorning, '2026-10-21', undefined, '2026-10-19'), false)

    const closedMorning = indexCalendarDays(
      [
        room(roomId, [
          eligible('2026-10-20', 'available'),
          eligible('2026-10-21', 'available', { checkoutEligible: false }),
        ]),
      ],
      roomId,
    )
    assert.equal(canFinishCheckOut('ready', '2026-10-19', closedMorning, '2026-10-20', '2026-10-21', undefined, '2026-10-19'), false)
  })

  it('follows earliest check-in, closed windows, and nightly stay limits', () => {
    const days = indexCalendarDays(
      [
        room(roomId, [
          eligible('2026-10-19', 'available', { checkInEligible: false, checkoutEligible: false, reason: 'window' }),
          eligible('2026-10-20', 'available', { minStay: 2, maxStay: 3, checkoutEligible: false }),
          eligible('2026-10-21', 'available', { minStay: 2, maxStay: 3 }),
          eligible('2026-10-22', 'available', { minStay: 2, maxStay: 3 }),
          eligible('2026-10-23', 'available', { minStay: 2, maxStay: 3 }),
          eligible('2026-10-24', 'available', { minStay: 2, maxStay: 3 }),
        ]),
      ],
      roomId,
    )
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-19', undefined, '2026-10-20'), false)
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-19', undefined, '2026-10-19'), false)
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-20', undefined, '2026-10-20'), true)
    assert.equal(canStartCheckIn('ready', '2026-10-19', days, '2026-10-20', undefined, null), false)
    assert.equal(canFinishCheckOut('ready', '2026-10-19', days, '2026-10-20', '2026-10-21', undefined, '2026-10-20'), false)
    assert.equal(canFinishCheckOut('ready', '2026-10-19', days, '2026-10-20', '2026-10-22', undefined, '2026-10-20'), true)
    assert.equal(canFinishCheckOut('ready', '2026-10-19', days, '2026-10-20', '2026-10-24', undefined, '2026-10-20'), false)
    assert.equal(dayStatusCopy('restricted', 'window'), 'Заїзд на цю дату вже недоступний')
    assert.equal(dayStatusCopy('restricted', 'window').includes('VALIDATION_ERROR'), false)
  })
})

function eligible(
  date: string,
  status: PublicCalendarDay['status'],
  extra: Partial<PublicCalendarDay> = {},
): PublicCalendarDay {
  return {
    date,
    status,
    availableCount: status === 'available' ? 1 : 0,
    reason: null,
    checkInEligible: status === 'available',
    checkoutEligible: true,
    minStay: 1,
    maxStay: null,
    ...extra,
  }
}

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canFinishCheckOut,
  canStartCheckIn,
  dayAriaLabel,
  dayStatusCopy,
  dayVisual,
  indexCalendarDays,
  reconcileStay,
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
})

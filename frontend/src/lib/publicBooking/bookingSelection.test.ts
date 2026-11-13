import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  bookingSubmitBlockReason,
  roomListPresentation,
  roomOptionFrame,
  roomOptionMark,
  groupAvailabilityRooms,
  ROOM_SELECTION_HEADING,
  ROOM_SELECTION_INSTRUCTION,
} from './bookingSelection'

const open = {
  bookingEnabled: true,
  step: 'collect',
  busy: false,
  searchable: true,
  roomSelected: true,
  availabilityStatus: 'ready' as const,
  quoteStatus: 'ready' as const,
  quoteReady: true,
  guestValid: true,
  roomRejected: false,
  roomMissing: false,
}

describe('booking accommodation selection', () => {
  it('names the step and explains that a choice is required', () => {
    assert.equal(ROOM_SELECTION_HEADING.room, 'Оберіть помешкання')
    assert.equal(ROOM_SELECTION_HEADING.house, 'Оберіть помешкання')
    assert.match(ROOM_SELECTION_INSTRUCTION, /Обране підсвічується/)
  })

  it('keeps dates, loading, errors and an empty list visually distinct', () => {
    assert.equal(roomListPresentation({ searchable: false, status: 'idle', error: '', place: 'room' }).state, 'need-dates')
    assert.equal(roomListPresentation({ searchable: true, status: 'loading', error: '', place: 'house' }).message, 'Шукаємо вільні помешкання…')
    assert.equal(
      roomListPresentation({ searchable: true, status: 'error', error: 'Немає зв’язку', place: 'room' }).state,
      'error',
    )
    const empty = roomListPresentation({ searchable: true, status: 'empty', error: '', place: 'house' })
    assert.equal(empty.state, 'empty')
    assert.match(empty.message, /помешкань/)
    assert.equal(roomListPresentation({ searchable: true, status: 'ready', error: '', place: 'room' }).state, 'ready')
    const grouped = groupAvailabilityRooms([
      { kind: 'ROOM' as const },
      { kind: 'COTTAGE' as const },
      { kind: 'ROOM' as const },
    ])
    assert.equal(grouped.rooms.length, 2)
    assert.equal(grouped.houses.length, 1)
  })

  it('marks the selected accommodation differently from the others', () => {
    assert.equal(roomOptionMark(true), 'Обрано')
    assert.equal(roomOptionMark(false), 'Обрати')
    assert.match(roomOptionFrame(true), /border-clay/)
    assert.match(roomOptionFrame(true), /bg-beige/)
    assert.equal(roomOptionFrame(true).includes('bg-beige'), true)
    assert.equal(roomOptionFrame(false).includes('border-2'), false)
  })

  it('explains why sending stays disabled until the stay is valid', () => {
    assert.equal(bookingSubmitBlockReason(open), null)
    assert.match(bookingSubmitBlockReason({ ...open, searchable: false }) ?? '', /дати/)
    assert.match(bookingSubmitBlockReason({ ...open, roomSelected: false, quoteReady: false }) ?? '', /помешкання/)
    assert.match(bookingSubmitBlockReason({ ...open, quoteStatus: 'loading', quoteReady: false }) ?? '', /сервера/)
    assert.match(bookingSubmitBlockReason({ ...open, availabilityStatus: 'error', quoteReady: false }) ?? '', /не можна/)
    assert.match(bookingSubmitBlockReason({ ...open, guestValid: false }) ?? '', /пошту/)
    assert.match(bookingSubmitBlockReason({ ...open, quoteReady: false }) ?? '', /застар/)
  })
})

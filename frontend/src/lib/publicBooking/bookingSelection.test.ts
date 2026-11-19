import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  bookableAvailabilityRooms,
  bookingSubmitBlockReason,
  cottageEmptyCopy,
  COTTAGE_CAPACITY_EMPTY_COPY,
  COTTAGE_EMPTY_COPY,
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
    assert.doesNotMatch(ROOM_SELECTION_INSTRUCTION, /Заявку можна надіслати/)
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
    assert.equal(empty.message, COTTAGE_EMPTY_COPY)
    assert.doesNotMatch(empty.message, /гостей/)
    const emptyRooms = roomListPresentation({ searchable: true, status: 'empty', error: '', place: 'room' })
    assert.doesNotMatch(emptyRooms.message, /гостей/)
    assert.equal(roomListPresentation({ searchable: true, status: 'ready', error: '', place: 'room' }).state, 'ready')
    const grouped = groupAvailabilityRooms([
      { kind: 'ROOM' as const },
      { kind: 'COTTAGE' as const },
      { kind: 'ROOM' as const },
    ])
    assert.equal(grouped.rooms.length, 2)
    assert.equal(grouped.houses.length, 1)
  })

  it('keeps a six-person cottage for two or six adults and not for seven', () => {
    const cottage = { kind: 'COTTAGE' as const, availableCount: 1, maxGuests: 6 }
    const accepts = (room: typeof cottage, adults: number) => adults <= room.maxGuests
    assert.deepEqual(bookableAvailabilityRooms([cottage], 2, accepts), [cottage])
    assert.deepEqual(bookableAvailabilityRooms([cottage], 6, accepts), [cottage])
    assert.deepEqual(bookableAvailabilityRooms([cottage], 7, accepts), [])
    assert.equal(cottageEmptyCopy({ adults: 2, cottages: [{ maxGuests: 6 }] }), COTTAGE_EMPTY_COPY)
    assert.equal(cottageEmptyCopy({ adults: 7, cottages: [{ maxGuests: 6 }] }), COTTAGE_CAPACITY_EMPTY_COPY)
  })

  it('marks the selected accommodation differently from the others', () => {
    assert.equal(roomOptionMark(true), 'Обрано')
    assert.equal(roomOptionMark(false), 'Обрати')
    assert.match(roomOptionFrame(true), /border-clay/)
    assert.match(roomOptionFrame(true), /border-2/)
    assert.equal(roomOptionFrame(true).includes('bg-beige'), false)
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

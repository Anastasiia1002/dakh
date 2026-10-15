import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calendarUsesTwoMonths,
  findRoomTypeBySlug,
  parseRoomSlugMap,
  resolveRoomTypeSlug,
  TWO_MONTH_MIN_PX,
} from './roomIdentity'

const rooms = [
  { roomTypeId: '11111111-1111-4111-8111-111111111111', slug: 'e2e-bukovyna', name: 'Кімната Буковина' },
  { roomTypeId: '22222222-2222-4222-8222-222222222222', slug: 'e2e-goryshche', name: 'Горище' },
]

describe('room identity', () => {
  it('uses the catalog slug itself unless an explicit pair says otherwise', () => {
    const map = parseRoomSlugMap('bukovyna=e2e-bukovyna, goryshche=e2e-goryshche')
    assert.equal(resolveRoomTypeSlug('bukovyna', map), 'e2e-bukovyna')
    assert.equal(resolveRoomTypeSlug('plats', map), 'plats')
    assert.equal(resolveRoomTypeSlug('bukovyna', parseRoomSlugMap(undefined)), 'bukovyna')
  })

  it('ignores malformed pairs and does not let a later pair replace the first', () => {
    const map = parseRoomSlugMap('bukovyna=e2e-bukovyna,not-a-pair,bukovyna=other, =missing')
    assert.equal(map.get('bukovyna'), 'e2e-bukovyna')
    assert.equal(map.has('not-a-pair'), false)
  })

  it('accepts only an exact slug and refuses a same-name substitute', () => {
    const map = parseRoomSlugMap('bukovyna=e2e-bukovyna')
    const expected = resolveRoomTypeSlug('bukovyna', map)
    assert.equal(findRoomTypeBySlug(rooms, expected)?.roomTypeId, rooms[0]?.roomTypeId)
    assert.equal(findRoomTypeBySlug(rooms, 'bukovyna'), null)
    assert.equal(findRoomTypeBySlug(rooms, 'e2e-goryshche')?.slug, 'e2e-goryshche')
    assert.equal(
      findRoomTypeBySlug(
        [
          { roomTypeId: 'a', slug: 'bukovyna', name: 'Кімната Буковина' },
          { roomTypeId: 'b', slug: 'bukovyna', name: 'Кімната Буковина' },
        ],
        'bukovyna',
      ),
      null,
    )
  })

  it('matches the verified catalog slug and ignores a TEST DATA name', () => {
    const staging = [
      { roomTypeId: 'goryshche-id', slug: 'goryshche', name: 'TEST DATA Буковина' },
      { roomTypeId: 'bukovyna-id', slug: 'bukovyna', name: 'TEST DATA Горище' },
      { roomTypeId: 'plats-id', slug: 'plats', name: 'TEST DATA Плац' },
    ]
    assert.equal(findRoomTypeBySlug(staging, 'bukovyna')?.roomTypeId, 'bukovyna-id')
    assert.equal(findRoomTypeBySlug(staging, 'goryshche')?.roomTypeId, 'goryshche-id')
    assert.equal(findRoomTypeBySlug(staging, 'plats')?.roomTypeId, 'plats-id')
    assert.equal(findRoomTypeBySlug(staging, 'TEST DATA Буковина'), null)
    assert.equal(findRoomTypeBySlug(staging, 'TEST DATA Горище'), null)
  })

  it('shows two months only when the calendar is wide enough', () => {
    assert.equal(calendarUsesTwoMonths(TWO_MONTH_MIN_PX - 1), false)
    assert.equal(calendarUsesTwoMonths(390), false)
    assert.equal(calendarUsesTwoMonths(TWO_MONTH_MIN_PX), true)
    assert.equal(calendarUsesTwoMonths(1440), true)
  })
})

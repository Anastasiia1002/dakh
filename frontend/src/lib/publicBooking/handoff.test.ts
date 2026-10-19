import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { handoffFromSearch, handoffToSearch, parseBookingHandoff, resolveBookingHandoff } from './handoff'

const merged = { VITE_ACCOMMODATION_HOTEL_MAP: 'merged' }
const split = { VITE_ACCOMMODATION_HOTEL_MAP: 'split' }

const roomTypeId = '11111111-1111-4111-8111-111111111111'
const ratePlanId = '22222222-2222-4222-8222-222222222222'

const handoff = {
  hotelSlug: 'dakh-e2e-primary',
  catalogSlug: 'bukovyna',
  roomTypeId,
  roomTypeSlug: 'e2e-bukovyna',
  checkIn: '2026-12-08',
  checkOut: '2026-12-13',
  adults: 2,
  children: 0,
  ratePlanId,
  preview: { totalAmount: '400.00', currency: 'UAH' as const },
}

describe('booking handoff', () => {
  it('keeps room, dates and guests and drops anything that is not on the allowlist', () => {
    const parsed = parseBookingHandoff({
      ...handoff,
      email: 'guest@example.test',
      phone: '+380501112233',
      quoteToken: 'secret',
      confirmationToken: 'secret',
      otp: '123456',
    })
    assert.deepEqual(parsed, handoff)
    assert.equal(JSON.stringify(parsed).includes('guest@example.test'), false)
    assert.equal(JSON.stringify(parsed).includes('quoteToken'), false)
  })

  it('rejects a stay that is not searchable and a rate plan that is not an id', () => {
    assert.equal(parseBookingHandoff({ ...handoff, checkOut: '2026-12-08' }), null)
    assert.equal(parseBookingHandoff({ ...handoff, ratePlanId: 'E2E Saver' }), null)
    assert.equal(parseBookingHandoff({ ...handoff, roomTypeId: 'bukovyna' }), null)
  })

  it('reads non-sensitive params from the URL and leaves the rate plan empty', () => {
    const params = new URLSearchParams({
      hotel: handoff.hotelSlug,
      room: handoff.catalogSlug,
      roomType: roomTypeId,
      type: handoff.roomTypeSlug,
      from: handoff.checkIn,
      to: handoff.checkOut,
      adults: '2',
      children: '0',
      email: 'guest@example.test',
    })
    const fromUrl = handoffFromSearch(params)
    assert.equal(fromUrl?.roomTypeId, roomTypeId)
    assert.equal(fromUrl?.ratePlanId, '')
    assert.equal(fromUrl?.preview, null)
  })

  it('uses the session rate plan on refresh when the URL still identifies the same room', () => {
    const params = new URLSearchParams({
      hotel: handoff.hotelSlug,
      room: handoff.catalogSlug,
      roomType: roomTypeId,
      type: handoff.roomTypeSlug,
      from: handoff.checkIn,
      to: handoff.checkOut,
      adults: '2',
      children: '0',
    })
    const resolved = resolveBookingHandoff({ state: null, params, stored: handoff })
    assert.equal(resolved?.ratePlanId, ratePlanId)
    assert.equal(resolved?.preview?.totalAmount, '400.00')
  })

  it('keeps both categories on the booking URL without the legacy hotel slug', () => {
    const rooms = handoffToSearch({
      ...handoff,
      hotelSlug: 'dakh',
      catalogSlug: 'dakh-room-14-1',
      roomTypeSlug: 'dakh-room-14-1',
    })
    const houses = handoffToSearch({
      ...handoff,
      hotelSlug: 'dakh',
      catalogSlug: 'house-7',
      roomTypeSlug: 'sunny-park-7',
    })
    assert.equal(rooms.get('category'), 'rooms')
    assert.equal(rooms.get('room'), 'dakh-room-14-1')
    assert.equal(rooms.get('hotel'), null)
    assert.equal(houses.get('category'), 'houses')
    assert.equal(houses.get('room'), 'house-7')
    assert.equal(houses.get('hotel'), null)
    assert.equal(houses.get('type'), null)
    assert.equal(houses.toString().includes('sunny-park'), false)
    const legacyHotel = handoffToSearch({
      ...handoff,
      hotelSlug: 'sunny-park',
      catalogSlug: 'house-8',
      roomTypeSlug: 'sunny-park-8',
    })
    assert.equal(legacyHotel.get('category'), 'houses')
    assert.equal(legacyHotel.get('room'), 'house-8')
    assert.equal(legacyHotel.toString().includes('sunny-park'), false)

    const restored = handoffFromSearch(houses, merged)
    assert.equal(restored?.hotelSlug, 'dakh')
    const legacy = handoffFromSearch(houses, split)
    assert.equal(legacy?.hotelSlug, 'sunny-park')
    assert.equal(handoffFromSearch(houses), null)
    assert.equal(handoffFromSearch(houses, { VITE_ACCOMMODATION_HOTEL_MAP: 'merged ' }), null)
    assert.equal(restored?.catalogSlug, 'house-7')
    assert.equal(restored?.roomTypeSlug, 'sunny-park-7')
    assert.equal(restored?.roomTypeId, roomTypeId)
  })

  it('ignores stored context on a direct visit without room parameters', () => {
    const resolved = resolveBookingHandoff({
      state: null,
      params: new URLSearchParams({ from: '2026-12-08', to: '2026-12-13', adults: '2' }),
      stored: handoff,
    })
    assert.equal(resolved, null)
  })
})

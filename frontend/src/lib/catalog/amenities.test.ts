import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { RoomCard } from '../../components/RoomCard'
import { AccommodationCopy } from '../../pages/RoomPage'
import type { PublicAccommodation, PublicAmenity } from '../publicBooking/types'
import { amenityGroups, cardAmenities } from './amenities'

const cover = { url: 'https://photos.example/cover.webp', alt: 'Обкладинка', sortOrder: 0 }

function amenity(partial: PublicAmenity): PublicAmenity {
  return partial
}

const assigned: PublicAmenity[] = [
  amenity({ key: 'kitchen', label: 'Кухня', category: 'KITCHEN', iconKey: 'kitchen', sortOrder: 20 }),
  amenity({ key: 'wifi', label: 'Wi-Fi', category: 'INTERNET_WORKSPACE', iconKey: 'wifi', sortOrder: 10 }),
  amenity({ key: 'fireplace', label: 'Камін', category: 'HEATING_COOLING', iconKey: 'fireplace', sortOrder: 30 }),
  amenity({ key: 'nearby-forest', label: 'Ліс', category: 'NEARBY', iconKey: 'nearby-forest', sortOrder: 40 }),
  amenity({ key: 'forest-view', label: 'Вид на ліс', category: 'VIEW', iconKey: 'forest-view', sortOrder: 5 }),
]

const room: PublicAccommodation = {
  id: 'room-1',
  slug: 'dakh-room-14-1',
  name: 'Номер 14/1',
  kind: 'ROOM',
  description: 'Світла кімната з терасою. Текст опису не додає зручностей.',
  maxGuests: 4,
  cover,
  images: [cover],
  hotelSlug: 'dakh',
}

function markup(node: ReturnType<typeof createElement>) {
  return renderToStaticMarkup(node)
}

describe('public amenities', () => {
  it('prefers useful assigned amenities and never invents the rest', () => {
    assert.deepEqual(
      cardAmenities(assigned).map((item) => item.key),
      ['wifi', 'kitchen', 'fireplace', 'forest-view'],
    )
    assert.deepEqual(cardAmenities(undefined), [])
    assert.deepEqual(cardAmenities([]), [])
    const groups = amenityGroups(assigned).map((group) => group.category)
    assert.deepEqual(groups, ['VIEW', 'HEATING_COOLING', 'INTERNET_WORKSPACE', 'KITCHEN', 'NEARBY'])
    assert.equal(groups.includes('OUTDOOR'), false)
  })

  it('shows assigned chips on a card and omits them when nothing is selected', () => {
    const withAmenities = markup(
      createElement(MemoryRouter, null, createElement(RoomCard, { accommodation: { ...room, amenities: assigned } })),
    )
    const without = markup(createElement(MemoryRouter, null, createElement(RoomCard, { accommodation: room })))
    assert.match(withAmenities, /Wi-Fi/)
    assert.match(withAmenities, /Кухня/)
    assert.doesNotMatch(withAmenities, /Баня|Чан|Басейн/)
    assert.doesNotMatch(without, /<li|Зручності|Камін/)
  })

  it('groups the detail section and hides it when the accommodation has no amenities', () => {
    const shown = markup(
      createElement(AccommodationCopy, { room: { ...room, amenities: assigned } }),
    )
    const hidden = markup(createElement(AccommodationCopy, { room }))
    assert.match(shown, /Зручності/)
    assert.match(shown, /Краєвиди/)
    assert.match(shown, /Вид на ліс/)
    assert.match(shown, /Поруч/)
    assert.match(shown, />Ліс</)
    assert.doesNotMatch(shown, /Надворі|Безпека/)
    assert.doesNotMatch(hidden, /Зручності|Камін|Вид на ліс/)
    assert.match(hidden, /Світла кімната/)
  })
})

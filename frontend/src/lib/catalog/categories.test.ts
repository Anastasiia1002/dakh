import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  accommodationHotelMapError,
  accommodationsInCategory,
  apiHotelSlug,
  bookingHotelMatchesCategory,
  categoryBase,
  categoryForKind,
  categoryLabel,
  toApiAccommodationSlug,
  toPublicAccommodationSlug,
  type AccommodationMapEnv,
} from './categories'

const stagingMerged: AccommodationMapEnv = { VITE_ACCOMMODATION_HOTEL_MAP: 'merged' }
const productionBeforeMigration: AccommodationMapEnv = { VITE_ACCOMMODATION_HOTEL_MAP: 'split' }
const productionAfterMigration: AccommodationMapEnv = {
  VITE_ACCOMMODATION_HOTEL_MAP: 'merged',
  VITE_PUBLIC_HOTEL_SLUG: 'dakh',
}

const mixedCatalog = [
  { kind: 'ROOM' as const, slug: 'dakh-room-14-1' },
  { kind: 'COTTAGE' as const, slug: 'sunny-park-7' },
  { kind: 'ROOM' as const, slug: 'dakh-room-14-3' },
  { kind: 'COTTAGE' as const, slug: 'sunny-park-12' },
]

describe('accommodation API hotel map', () => {
  it('sends both categories to dakh after the staging merge', () => {
    assert.equal(accommodationHotelMapError(stagingMerged), null)
    assert.equal(apiHotelSlug('rooms', stagingMerged), 'dakh')
    assert.equal(apiHotelSlug('houses', stagingMerged), 'dakh')
  })

  it('keeps production cottages on sunny-park before that database migration', () => {
    assert.equal(accommodationHotelMapError(productionBeforeMigration), null)
    assert.equal(apiHotelSlug('rooms', productionBeforeMigration), 'dakh')
    assert.equal(apiHotelSlug('houses', productionBeforeMigration), 'sunny-park')
    assert.notEqual(apiHotelSlug('rooms', productionBeforeMigration), apiHotelSlug('houses', productionBeforeMigration))
  })

  it('sends both categories to dakh after the production migration', () => {
    assert.equal(accommodationHotelMapError(productionAfterMigration), null)
    assert.equal(apiHotelSlug('rooms', productionAfterMigration), 'dakh')
    assert.equal(apiHotelSlug('houses', productionAfterMigration), 'dakh')
    assert.equal(bookingHotelMatchesCategory('sunny-park', 'houses', productionAfterMigration), true)
    assert.equal(bookingHotelMatchesCategory('dakh', 'houses', productionAfterMigration), true)
  })

  it('fails closed when the map is missing or invalid', () => {
    for (const env of [
      {},
      { VITE_ACCOMMODATION_HOTEL_MAP: '' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'SPLIT' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'merged ' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'legacy' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'true' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'split', VITE_PUBLIC_HOTEL_SLUG: 'sunny-park' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'merged', VITE_PUBLIC_HOTEL_SLUG: 'sunny-park' },
      { VITE_ACCOMMODATION_HOTEL_MAP: 'merged', VITE_PUBLIC_HOTEL_SLUG: 'dakh-e2e-primary' },
    ]) {
      assert.equal(apiHotelSlug('rooms', env), null)
      assert.equal(apiHotelSlug('houses', env), null)
      assert.match(accommodationHotelMapError(env) ?? '', /VITE_ACCOMMODATION_HOTEL_MAP|VITE_PUBLIC_HOTEL_SLUG/)
      assert.equal(bookingHotelMatchesCategory('dakh', 'rooms', env), false)
      assert.equal(bookingHotelMatchesCategory('sunny-park', 'houses', env), false)
    }
    assert.equal(apiHotelSlug('houses'), null)
    assert.equal(
      accommodationHotelMapError({ VITE_ACCOMMODATION_HOTEL_MAP: 'split', VITE_PUBLIC_HOTEL_SLUG: ' DAKH ' }),
      null,
    )
  })

  it('separates rooms and cottages without changing the public routes', () => {
    assert.deepEqual(
      accommodationsInCategory(mixedCatalog, 'rooms').map((item) => item.slug),
      ['dakh-room-14-1', 'dakh-room-14-3'],
    )
    assert.deepEqual(
      accommodationsInCategory(mixedCatalog, 'houses').map((item) => item.slug),
      ['sunny-park-7', 'sunny-park-12'],
    )
    assert.equal(categoryForKind('ROOM'), 'rooms')
    assert.equal(categoryForKind('COTTAGE'), 'houses')
    assert.equal(categoryBase('rooms'), '/rooms')
    assert.equal(categoryBase('houses'), '/houses')
    assert.equal(categoryLabel('rooms'), 'Кімнати')
    assert.equal(categoryLabel('houses'), 'Будинки')
    assert.doesNotMatch(`${categoryLabel('rooms')} ${categoryLabel('houses')}`, /Sunny Park|sunny-park/)
    assert.equal(toPublicAccommodationSlug('houses', 'sunny-park-7'), 'house-7')
    assert.equal(toPublicAccommodationSlug('rooms', 'dakh-room-14-1'), 'dakh-room-14-1')
    assert.equal(toApiAccommodationSlug('rooms', 'house-7'), null)
    assert.equal(toApiAccommodationSlug('rooms', 'sunny-park-7'), null)
    assert.equal(toApiAccommodationSlug('houses', 'house-7'), 'sunny-park-7')
    assert.equal(toApiAccommodationSlug('houses', 'dakh-room-14-1'), null)
    assert.equal(bookingHotelMatchesCategory('dakh', 'rooms', productionBeforeMigration), true)
    assert.equal(bookingHotelMatchesCategory('sunny-park', 'rooms', productionBeforeMigration), false)
    assert.equal(bookingHotelMatchesCategory('sunny-park', 'houses', productionBeforeMigration), true)
    assert.equal(bookingHotelMatchesCategory('dakh', 'houses', productionBeforeMigration), false)
  })
})

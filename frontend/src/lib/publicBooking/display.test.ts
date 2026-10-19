import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  catalogNameForRoomTypeSlug,
  isFixtureLabel,
  isHiddenInventoryLabel,
  publicPlanTitle,
  publicRoomLabel,
} from './display'

const catalog = [
  { slug: 'bukovyna', name: 'Кімната Буковина' },
  { slug: 'goryshche', name: 'Горище DAKH' },
]
const map = new Map([
  ['bukovyna', 'e2e-bukovyna'],
  ['goryshche', 'e2e-goryshche'],
])

describe('public booking labels', () => {
  it('uses the catalog name only when one page maps to that room slug', () => {
    assert.equal(catalogNameForRoomTypeSlug('e2e-bukovyna', catalog, map), 'Кімната Буковина')
    assert.equal(catalogNameForRoomTypeSlug('e2e-bukovyna', [...catalog, { slug: 'other', name: 'Інша' }], new Map()), null)
    assert.equal(
      catalogNameForRoomTypeSlug('e2e-bukovyna', [...catalog, { slug: 'copy', name: 'Копія' }], new Map([
        ['bukovyna', 'e2e-bukovyna'],
        ['copy', 'e2e-bukovyna'],
      ])),
      null,
    )
  })

  it('hides fixture room and rate names without inventing a different room', () => {
    assert.equal(isFixtureLabel('E2E Bukovyna'), true)
    assert.equal(isFixtureLabel('Кімната Буковина'), false)
    assert.equal(publicRoomLabel('E2E Bukovyna', 'ROOM', 'Кімната Буковина'), 'Кімната Буковина')
    assert.equal(publicRoomLabel('E2E Bukovyna', 'ROOM', null), 'Кімната')
    assert.equal(publicRoomLabel('Сімейний', 'ROOM', null), 'Сімейний')
    assert.equal(publicPlanTitle({ name: 'E2E Overlap Prices', type: 'STANDARD' }), 'Стандарт')
    assert.equal(publicPlanTitle({ name: 'Зі сніданком', type: 'STANDARD' }), 'Зі сніданком')
  })

  it('hides TEST DATA room and tariff labels without matching them to another catalog room', () => {
    assert.equal(isHiddenInventoryLabel('TEST DATA Буковина'), true)
    assert.equal(isHiddenInventoryLabel('test data Тестовий тариф'), true)
    assert.equal(isHiddenInventoryLabel('Кімната Буковина'), false)
    assert.equal(publicRoomLabel('TEST DATA Буковина', 'ROOM', 'Кімната Буковина'), 'Кімната Буковина')
    assert.equal(publicRoomLabel('TEST DATA Горище', 'ROOM', null), 'Кімната')
    assert.equal(publicPlanTitle({ name: 'TEST DATA Тестовий тариф', type: 'STANDARD' }), 'Стандарт')
  })

  it('labels the staging QA tariff as a demonstration price', () => {
    assert.equal(publicPlanTitle({ name: 'Staging public E2E', type: 'STANDARD', demo: true }), 'Демонстраційний тариф')
    assert.equal(publicPlanTitle({ name: 'Staging public E2E', type: 'STANDARD' }), 'Демонстраційний тариф')
    assert.equal(
      publicPlanTitle({ name: 'Стандарт', type: 'STANDARD', nightlyStartingPrice: '2000.00' }),
      'Демонстраційний тариф',
    )
    assert.equal(publicPlanTitle({ name: 'Стандарт', type: 'STANDARD', nightlyStartingPrice: '4800.00' }), 'Стандарт')
  })
})

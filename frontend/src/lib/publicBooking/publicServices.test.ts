import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServiceOptions } from '../../components/booking/ServiceOptions'
import { errorCopy, PublicApiError } from './errors'
import {
  canonicalServiceSelection,
  guestPicksServiceQuantity,
  quoteServiceSelection,
  selectedServiceLines,
  SERVICE_CHARGE_UNIT,
  SERVICE_SECTION_HEADING,
  serviceQuantityBounds,
  serviceSelectionKey,
} from './publicServices'
import { isCatalogItem, pruneServiceQuantities } from './usePublicServices'
import type { PublicServiceCatalogItem } from './types'

const breakfast: PublicServiceCatalogItem = {
  id: 'svc-1',
  name: 'Сніданок',
  description: 'На все проживання',
  price: '400.00',
  currency: 'UAH',
  chargeBasis: 'PER_STAY',
  minQuantity: 2,
  maxQuantity: 4,
}

describe('public service selection', () => {
  it('keeps an empty selection off the request and clamps a chosen quantity', () => {
    assert.deepEqual(selectedServiceLines({}, [breakfast]), [])
    assert.deepEqual(serviceQuantityBounds(breakfast), { min: 2, max: 4 })
    assert.deepEqual(selectedServiceLines({ 'svc-1': 1 }, [breakfast]), [{ serviceId: 'svc-1', quantity: 2 }])
    assert.deepEqual(selectedServiceLines({ 'svc-1': 9 }, [breakfast]), [{ serviceId: 'svc-1', quantity: 4 }])
    assert.equal(serviceSelectionKey([{ serviceId: 'b', quantity: 1 }, { serviceId: 'a', quantity: 2 }]), 'a:2|b:1')
    assert.deepEqual(canonicalServiceSelection(undefined), [])
  })

  it('offers extras after a stay with a per-stay price, and drops other charge bases', () => {
    assert.equal(SERVICE_SECTION_HEADING, 'Додаткові послуги')
    assert.equal(SERVICE_CHARGE_UNIT.PER_STAY, 'за бронювання')
    assert.equal(SERVICE_CHARGE_UNIT.PER_NIGHT, 'за ніч')
    assert.equal(breakfast.chargeBasis, 'PER_STAY')
    const extra: PublicServiceCatalogItem = {
      id: 'svc-night',
      name: 'Додаткове спальне місце',
      description: null,
      price: '40.00',
      currency: 'UAH',
      chargeBasis: 'PER_NIGHT',
      minQuantity: null,
      maxQuantity: null,
    }
    assert.equal(guestPicksServiceQuantity(extra), false)
    assert.deepEqual(serviceQuantityBounds(extra), { min: 1, max: 1 })
    assert.deepEqual(selectedServiceLines({ 'svc-night': 9 }, [extra]), [])
    assert.deepEqual(selectedServiceLines({ 'svc-night': 9 }, [extra], 3), [{ serviceId: 'svc-night', quantity: 3 }])
    assert.equal(isCatalogItem(breakfast), true)
    assert.equal(isCatalogItem(extra), true)
    assert.equal(isCatalogItem({ ...breakfast, chargeBasis: 'PER_PERSON_DAY' } as PublicServiceCatalogItem), false)
    const loading = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [], quantities: {}, status: 'loading', onChange() {} }),
    )
    assert.match(loading, /Додаткові послуги/)
    assert.match(loading, /Завантажуємо послуги/)
    const empty = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [], quantities: {}, status: 'empty', onChange() {} }),
    )
    assert.match(empty, /Додаткові послуги/)
    assert.match(empty, /немає послуг, які можна додати/)
    const failed = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [], quantities: {}, status: 'error', onChange() {} }),
    )
    assert.match(failed, /не вдалося показати/)
    assert.doesNotMatch(failed, /catalog|PER_STAY|API/)
    const listed = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [breakfast], quantities: {}, status: 'ready', onChange() {} }),
    )
    assert.match(listed, /Додаткові послуги/)
    assert.match(listed, /за бронювання/)
    assert.doesNotMatch(listed, /немає послуг, які можна додати/)
    const nightListed = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [extra], quantities: { 'svc-night': 1 }, status: 'ready', onChange() {} }),
    )
    assert.match(nightListed, /за ніч/)
    assert.match(nightListed, /Прибрати/)
    assert.doesNotMatch(nightListed, /Збільшити/)
    assert.match(nightListed, /flex-col gap-3 sm:flex-row/)
    const staySummary = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [breakfast, extra], quantities: {}, status: 'ready', onChange() {} }),
    )
    assert.match(staySummary, /за бронювання/)
    assert.match(staySummary, /за ніч/)
  })

  it('drops extras that the current catalog no longer offers', () => {
    assert.deepEqual(pruneServiceQuantities({ 'svc-1': 2, 'gone': 1 }, [breakfast]), { 'svc-1': 2 })
    const same = { 'svc-1': 2 }
    assert.equal(pruneServiceQuantities(same, [breakfast]), same)
  })

  it('keeps extras on the contacts step after a room is chosen', () => {
    const flow = readFileSync(new URL('../../pages/BookingFlow.tsx', import.meta.url), 'utf8')
    const options = readFileSync(new URL('../../components/booking/ServiceOptions.tsx', import.meta.url), 'utf8')
    const summary = readFileSync(new URL('../../components/booking/CheckoutPanels.tsx', import.meta.url), 'utf8')
    assert.match(flow, /bookingEnabled && search.selectedRoom/)
    assert.match(flow, /pruneServiceQuantities/)
    assert.match(flow, /<legend className="font-display text-3xl">Контакти<\/legend>/)
    assert.match(options, /status === 'error'/)
    assert.doesNotMatch(options, /if \(items.length === 0\) return null/)
    assert.doesNotMatch(options, /сервер|PER_STAY|catalog/)
    assert.match(summary, /quote.services/)
    assert.match(summary, /line.totalPrice/)
    assert.doesNotMatch(summary, /unitPrice/)
  })

  it('sends only the server quote lines and maps an invalid service error', () => {
    assert.equal(quoteServiceSelection({}), undefined)
    assert.deepEqual(quoteServiceSelection({ services: [{ serviceId: 'svc-1', name: 'Сніданок', quantity: 2, unitPrice: '1', totalPrice: '2', currency: 'UAH' }] }), [
      { serviceId: 'svc-1', quantity: 2 },
    ])
    assert.match(
      errorCopy(new PublicApiError({ statusCode: 400, error: 'SERVICE_NOT_BOOKABLE', message: '' })),
      /не можна додати/,
    )
  })
})

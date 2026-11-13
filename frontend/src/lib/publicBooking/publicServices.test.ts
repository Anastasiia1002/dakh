import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServiceOptions } from '../../components/booking/ServiceOptions'
import { errorCopy, PublicApiError } from './errors'
import {
  canonicalServiceSelection,
  quoteServiceSelection,
  selectedServiceLines,
  SERVICE_CHARGE_UNIT,
  SERVICE_SECTION_HEADING,
  serviceQuantityBounds,
  serviceSelectionKey,
} from './publicServices'
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
    assert.equal(SERVICE_SECTION_HEADING, 'Додайте до проживання')
    assert.equal(SERVICE_CHARGE_UNIT.PER_STAY, 'за бронювання')
    assert.equal(breakfast.chargeBasis, 'PER_STAY')
    const empty = renderToStaticMarkup(createElement(ServiceOptions, { items: [], quantities: {}, onChange() {} }))
    assert.equal(empty, '')
    const listed = renderToStaticMarkup(
      createElement(ServiceOptions, { items: [breakfast], quantities: {}, onChange() {} }),
    )
    assert.match(listed, /Додайте до проживання/)
    assert.match(listed, /за бронювання/)
    assert.doesNotMatch(listed, /Додаткових послуг зараз немає/)
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

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BOOKING_DRAFT_KEY,
  parseVersionedDraft,
  readBookingDraft,
  visibleWizardSteps,
  writeBookingDraft,
} from './bookingDraft'
import { parseBookingHandoff } from './handoff'
import { selectedServiceLines } from './publicServices'
import type { PublicServiceCatalogItem } from './types'

const roomTypeId = '11111111-1111-4111-8111-111111111111'
const serviceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const serviceB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function memorySession() {
  const memory = new Map<string, string>()
  return {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value)
    },
    removeItem: (key: string) => {
      memory.delete(key)
    },
  }
}

describe('versioned booking draft', () => {
  it('keeps extras, contacts and occupancy and never stores an OTP', () => {
    const sessionStorage = memorySession()
    const previous = (globalThis as { window?: unknown }).window
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { sessionStorage } })
    try {
      writeBookingDraft({
        adults: 3,
        children: 0,
        roomTypeId,
        services: { [serviceA]: 2, [serviceB]: 1 },
        email: 'guest@example.test',
        phone: '+380501112233',
        firstName: 'Анна',
        lastName: 'Коваль',
        pending: {
          intentId: 'intent-1',
          emailMasked: 'g***@example.test',
          expiresAt: '2026-12-01T12:00:00.000Z',
          cooldownUntil: Date.now() + 30_000,
          otpExpiresAt: '2026-12-01T12:10:00.000Z',
        },
      })
      const stored = JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY) ?? '{}') as Record<string, unknown>
      assert.equal(stored.adults, 3)
      assert.equal(JSON.stringify(stored).includes('123456'), false)
      assert.equal('otp' in stored, false)
      const draft = readBookingDraft()
      assert.equal(draft?.email, 'guest@example.test')
      assert.equal(draft?.services[serviceA], 2)
      assert.equal(draft?.pending?.intentId, 'intent-1')
      assert.equal(parseVersionedDraft({ ...stored, otp: '123456' }), null)
    } finally {
      if (previous === undefined) delete (globalThis as { window?: unknown }).window
      else Object.defineProperty(globalThis, 'window', { configurable: true, value: previous })
    }
  })

  it('keeps placement visible when a unit is already selected', () => {
    assert.deepEqual(
      visibleWizardSteps(true).map((step) => step.label),
      ['Дати й гості', 'Розміщення', 'Послуги', 'Контакти', 'Підтвердження'],
    )
  })

  it('binds legacy extras only to the known unit', () => {
    const now = Date.now()
    const unitA = roomTypeId
    const unitB = '22222222-2222-4222-8222-222222222222'
    const v1 = parseVersionedDraft({
      v: 1,
      savedAt: now,
      expiresAt: now + 60_000,
      step: 'extras',
      extrasSkipped: false,
      checkIn: '2026-12-20',
      checkOut: '2026-12-22',
      adults: 2,
      children: 0,
      hotelSlug: 'dakh',
      catalogSlug: 'bukovyna',
      roomTypeId: unitA,
      roomTypeSlug: 'bukovyna',
      ratePlanId: '',
      services: { [serviceA]: 2 },
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      comment: '',
      pending: null,
    }, now)
    assert.equal(v1?.services[serviceA], 2)
    assert.equal(v1?.servicesByUnit[unitA]?.[serviceA], 2)
    assert.equal(v1?.servicesByUnit[unitB], undefined)
    const unscoped = parseVersionedDraft({
      v: 1,
      savedAt: now,
      expiresAt: now + 60_000,
      step: 'extras',
      extrasSkipped: false,
      checkIn: '2026-12-20',
      checkOut: '2026-12-22',
      adults: 2,
      children: 0,
      hotelSlug: '',
      catalogSlug: '',
      roomTypeId: '',
      roomTypeSlug: '',
      ratePlanId: '',
      services: { [serviceA]: 2 },
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      comment: '',
      pending: null,
    }, now)
    assert.deepEqual(unscoped?.services, {})
    assert.deepEqual(unscoped?.servicesByUnit, {})
  })

  it('keeps extras on the session handoff and recalculates per-night quantity after a date change', () => {
    const parsed = parseBookingHandoff({
      hotelSlug: 'dakh',
      catalogSlug: 'bukovyna',
      roomTypeId,
      roomTypeSlug: 'bukovyna',
      checkIn: '2026-12-10',
      checkOut: '2026-12-12',
      adults: 2,
      children: 0,
      ratePlanId: '',
      preview: null,
      services: { [serviceA]: 1 },
    })
    assert.equal(parsed?.services?.[serviceA], 1)
    const nights = [
      {
        id: serviceA,
        name: 'Сніданок',
        description: null,
        price: '300.00',
        currency: 'UAH' as const,
        chargeBasis: 'PER_NIGHT',
        onlinePricing: 'PER_NIGHT' as const,
        minQuantity: 1,
        maxQuantity: 1,
      } satisfies PublicServiceCatalogItem,
    ]
    assert.deepEqual(selectedServiceLines({ [serviceA]: 1 }, nights, 2), [{ serviceId: serviceA, quantity: 2 }])
    assert.deepEqual(selectedServiceLines({ [serviceA]: 1 }, nights, 4), [{ serviceId: serviceA, quantity: 4 }])
  })
})

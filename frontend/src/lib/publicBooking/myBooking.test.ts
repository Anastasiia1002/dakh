import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { PublicApiError } from './errors'
import {
  LOOKUP_EMPTY_COPY,
  LOOKUP_INVALID_COPY,
  LOOKUP_RATE_COPY,
  accessCodeError,
  guestBookingView,
  lookupFailureCopy,
  lookupGuestBooking,
} from './myBooking'
import type { PublicBookingConfirmationResponse } from './types'
import { guestCountLabel } from '../ukrainian'

const TOKEN = 'a'.repeat(24)

function confirmation(overrides: Partial<PublicBookingConfirmationResponse> = {}): PublicBookingConfirmationResponse {
  return {
    status: 'CONFIRMED',
    bookingReference: 'DAKH-100',
    checkIn: '2026-12-10',
    checkOut: '2026-12-12',
    guestCount: 4,
    roomTypeId: 'room-1',
    roomTypeName: 'Кімната 14/3',
    totalAmount: '4000.00',
    currency: 'UAH',
    confirmationToken: TOKEN,
    ...overrides,
  }
}

describe('guest booking lookup', () => {
  it('rejects an empty or short access code before any request', () => {
    assert.equal(accessCodeError('   '), LOOKUP_EMPTY_COPY)
    assert.equal(accessCodeError('short-code'), LOOKUP_INVALID_COPY)
    assert.equal(accessCodeError(`  ${TOKEN}  `), null)
  })

  it('shows the current server booking and never the access code', () => {
    const view = guestBookingView(confirmation(), 'Кімната з видом', guestCountLabel(4))
    assert.equal(view?.statusLabel, 'Підтверджено')
    assert.equal(view?.accommodation, 'Кімната з видом')
    assert.equal(view?.nights, 2)
    assert.equal(view?.guests, '4 гості')
    assert.equal(view?.totalAmount, '4000.00')
    assert.equal(JSON.stringify(view).includes(TOKEN), false)
    assert.equal(JSON.stringify(view).includes('confirmationToken'), false)
  })

  it('reflects a later server response instead of the first snapshot', () => {
    const first = guestBookingView(confirmation(), 'Кімната', guestCountLabel(2))
    const updated = guestBookingView(
      confirmation({ totalAmount: '2000.00', checkOut: '2026-12-11', guestCount: 2 }),
      'Кімната',
      guestCountLabel(2),
    )
    assert.equal(first?.totalAmount, '4000.00')
    assert.equal(updated?.totalAmount, '2000.00')
    assert.equal(updated?.nights, 1)
    assert.equal(updated?.guests, '2 гості')
  })

  it('shows a cancelled booking, party, services, and payment from the server', () => {
    assert.equal(guestBookingView(confirmation({ currency: 'EUR' as 'UAH' }), 'Кімната', '2 гості'), null)
    const cancelled = guestBookingView(
      confirmation({
        status: 'CANCELLED',
        adults: 2,
        children: 1,
        roomNumber: '14',
        paymentStatus: 'UNPAID',
        services: [
          {
            serviceId: 'svc-1',
            name: 'Сніданок',
            quantity: 2,
            unitPrice: '100.00',
            totalPrice: '200.00',
            currency: 'UAH',
          },
        ],
      }),
      'Кімната',
      guestCountLabel(3),
    )
    assert.equal(cancelled?.statusLabel, 'Скасовано')
    assert.equal(cancelled?.cancelled, true)
    assert.equal(cancelled?.guests, '2 дорослих, 1 дитина')
    assert.equal(cancelled?.roomNumber, '14')
    assert.equal(cancelled?.services[0]?.totalPrice, '200.00')
    assert.equal(cancelled?.paymentLabel, 'Не оплачено')
    assert.equal(JSON.stringify(cancelled).includes(TOKEN), false)
    const withoutParty = guestBookingView(confirmation(), 'Кімната', guestCountLabel(4))
    assert.equal(withoutParty?.adults, null)
    assert.equal(withoutParty?.services.length, 0)
    assert.equal(withoutParty?.paymentLabel, null)
  })

  it('uses one message for an unknown code and a different one for rate limiting', () => {
    assert.equal(
      lookupFailureCopy(new PublicApiError({ statusCode: 404, error: 'CONFIRMATION_NOT_FOUND', message: 'secret detail' })),
      LOOKUP_INVALID_COPY,
    )
    assert.equal(
      lookupFailureCopy(new PublicApiError({ statusCode: 429, error: 'RATE_LIMITED', message: 'slow down' })),
      LOOKUP_RATE_COPY,
    )
    assert.equal(lookupFailureCopy(new Error('Failed to fetch')), 'Не вдалося зв’язатися з сервером бронювання.')
  })

  it('requests the booking with no-store and returns no token', async () => {
    let seen: RequestInit | undefined
    const view = await lookupGuestBooking(
      ` ${TOKEN} `,
      () => 'Кімната',
      guestCountLabel,
      {
        confirmation(token, init) {
          seen = init
          assert.equal(token, TOKEN)
          return Promise.resolve(confirmation({ confirmationToken: token }))
        },
      },
    )
    assert.equal(seen?.cache, 'no-store')
    assert.equal(JSON.stringify(view).includes(TOKEN), false)
  })

  it('does not store the access code in the page', () => {
    const page = readFileSync(new URL('../../pages/MyBookingPage.tsx', import.meta.url), 'utf8')
    const lookup = readFileSync(new URL('./myBooking.ts', import.meta.url), 'utf8')
    const app = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8')
    assert.equal(page.includes('localStorage'), false)
    assert.equal(page.includes('sessionStorage'), false)
    assert.equal(page.includes('gtag'), false)
    assert.match(lookup, /cache: 'no-store'/)
    assert.match(readFileSync(new URL('./client.ts', import.meta.url), 'utf8'), /method: 'POST'/)
    assert.equal(readFileSync(new URL('./client.ts', import.meta.url), 'utf8').includes('/bookings/confirmation/${'), false)
    assert.match(page, /type=\{revealed \? 'text' : 'password'\}/)
    assert.match(app, /path="\/moie-bronyuvannya"/)
  })
})

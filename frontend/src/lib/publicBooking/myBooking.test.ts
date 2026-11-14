import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { PublicApiError } from './errors'
import { canonicalAccessCode } from './checkout'
import {
  LOOKUP_EMPTY_COPY,
  LOOKUP_FORMAT_COPY,
  LOOKUP_INVALID_COPY,
  LOOKUP_RATE_COPY,
  LOOKUP_REFERENCE_COPY,
  accessCodeError,
  guestBookingView,
  lookupFailureCopy,
  lookupGuestBooking,
  normalizeAccessCode,
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
    assert.equal(accessCodeError('abcd-efgh-jklm'), null)
    assert.equal(accessCodeError('abcd efgh jklm'), null)
    assert.equal(accessCodeError('ABCD-EFGH-JKL0'), LOOKUP_INVALID_COPY)
    assert.equal(accessCodeError('11111111-1111-4111-8111-111111111111'), LOOKUP_REFERENCE_COPY)
    assert.equal(accessCodeError('11111111111141118111111111111111'), LOOKUP_REFERENCE_COPY)
    assert.equal(accessCodeError('11111111111141118111111111111111'.toUpperCase()), LOOKUP_REFERENCE_COPY)
    assert.equal(LOOKUP_REFERENCE_COPY.includes('без дефісів'), false)
    const issued = `${'A'.repeat(20)}-${'b'.repeat(22)}`
    assert.equal(issued.length, 43)
    assert.equal(accessCodeError(issued), null)
    assert.equal(normalizeAccessCode(`  ${issued}`), issued)
    assert.equal(normalizeAccessCode(' abcd-efgh-jklm '), 'ABCD-EFGH-JKLM')
    assert.equal(canonicalAccessCode('abcd-efgh-jkl0'), 'abcd-efgh-jkl0')
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
        guestCount: 3,
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
    assert.equal(cancelled?.guests, '2 дорослих · 1 дитина')
    const adultsOnly = guestBookingView(confirmation({ adults: 2, children: 0, guestCount: 2 }), 'Кімната', '2 гості')
    assert.equal(adultsOnly?.guests, '2 дорослих')
    const unmatched = guestBookingView(confirmation({ adults: 1, children: 0, guestCount: 4 }), 'Кімната', '4 гості')
    assert.equal(unmatched?.guests, '4 гості')
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
    assert.equal(
      lookupFailureCopy(new PublicApiError({ statusCode: 503, error: 'INTERNAL_ERROR', message: 'down' })),
      'Сервер бронювання тимчасово недоступний. Спробуйте пізніше.',
    )
    assert.notEqual(
      lookupFailureCopy(new PublicApiError({ statusCode: 503, error: 'INTERNAL_ERROR', message: 'down' })),
      LOOKUP_INVALID_COPY,
    )
    assert.equal(lookupFailureCopy(new Error(LOOKUP_REFERENCE_COPY)), LOOKUP_REFERENCE_COPY)
  })

  it('does not send a booking reference to the lookup', async () => {
    let called = false
    const client = {
      confirmation() {
        called = true
        return Promise.resolve(confirmation())
      },
    }
    for (const code of ['11111111-1111-4111-8111-111111111111', '11111111111141118111111111111111']) {
      called = false
      await assert.rejects(
        lookupGuestBooking(code, () => 'Кімната', guestCountLabel, client),
        (error: unknown) => error instanceof Error && error.message === LOOKUP_REFERENCE_COPY,
      )
      assert.equal(called, false)
    }
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
    const bookingFlow = readFileSync(new URL('../../pages/BookingFlow.tsx', import.meta.url), 'utf8')
    const confirmationPage = readFileSync(new URL('../../pages/ConfirmationPage.tsx', import.meta.url), 'utf8')
    const quoteSummary = readFileSync(new URL('../../components/booking/CheckoutPanels.tsx', import.meta.url), 'utf8')
    assert.equal(bookingFlow.includes('Дані з сервера'), false)
    assert.equal(bookingFlow.includes('Оплату на сайті не приймаємо'), false)
    assert.equal(bookingFlow.includes('Сума з сервера'), false)
    assert.equal(confirmationPage.includes('Дані з сервера'), false)
    assert.equal(confirmationPage.includes('Оплату на сайті не приймаємо'), false)
    assert.equal(quoteSummary.includes('Дані з сервера'), false)
    assert.equal(quoteSummary.includes('Оплату на сайті не приймаємо'), false)
    assert.equal(bookingFlow.includes('/bronuvannya/pidtverdzhennya/${'), false)
    assert.match(bookingFlow, /navigate\('\/bronuvannya\/pidtverdzhennya', \{ replace: true \}\)/)
    assert.equal(confirmationPage.includes('decodeURIComponent(routeToken)'), false)
    assert.match(confirmationPage, /id="issued-access-code"/)
    assert.match(confirmationPage, /Код доступу до підтвердження/)
    assert.match(confirmationPage, /MISSING_SESSION_COPY/)
    assert.match(confirmationPage, /Копіювати код/)
    assert.match(confirmationPage, /aria-label="Копіювати код"/)
    assert.match(confirmationPage, /Скопійовано/)
    assert.match(confirmationPage, /text-\[13px\]/)
    assert.equal(confirmationPage.includes('navigator.clipboard.writeText'), true)
    assert.equal(confirmationPage.includes('localStorage'), false)
    assert.match(page, /LOOKUP_FORMAT_COPY/)
    assert.equal(LOOKUP_FORMAT_COPY.includes('ABCD-EFGH-JKLM'), true)
    assert.match(page, /className="access-code/)
    const styles = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8')
    assert.match(styles, /\.access-code::selection/)
    assert.match(styles, /background: var\(--color-wood\)/)
    assert.match(styles, /color: var\(--color-linen\)/)
    const layout = readFileSync(new URL('../../components/Layout.tsx', import.meta.url), 'utf8')
    assert.match(layout, /footerNav/)
    assert.equal(layout.includes("to: '/moie-bronyuvannya'"), true)
    const headerSource = layout.slice(0, layout.indexOf('footerNav'))
    assert.equal(headerSource.includes('/moie-bronyuvannya'), false)
    assert.match(confirmationPage, /navigate\('\/bronuvannya\/pidtverdzhennya', \{ replace: true \}\)/)
    assert.match(confirmationPage, /writeStoredConfirmationToken\(routeCode\)/)
    assert.match(confirmationPage, /markInvalidConfirmationRoute\(\)/)
    assert.match(confirmationPage, /confirmationLookupCopy/)
  })
})

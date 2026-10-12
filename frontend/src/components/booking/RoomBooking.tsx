import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingCalendar } from '../BookingCalendar'
import { emptyDraft, type BookingDraft } from '../../lib/booking'
import {
  guestCountOf,
  guestFieldErrors,
  guestFormIsValid,
  isQuoteFresh,
  selectedRatePlanId,
  stayNights,
  useBookingCheckout,
  useStaySearch,
  type GuestFieldErrors,
} from '../../lib/publicBooking'
import { reconcileStay } from '../../lib/publicBooking/calendar'
import { readStoredConfirmationToken } from '../../lib/publicBooking/checkout'
import { useMappedRoomCalendar } from '../../lib/publicBooking/useMappedRoomCalendar'
import { formatBookingPhone } from '../../lib/phone'
import {
  GuestFields,
  OtpPanel,
  PriceChangePanel,
  QuoteSummary,
} from './CheckoutPanels'

export function RoomBooking({ catalogSlug }: { catalogSlug: string }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<BookingDraft>(() => ({ ...emptyDraft, adults: 2 }))
  const [guestErr, setGuestErr] = useState<GuestFieldErrors>({})
  const [otpCode, setOtpCode] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(() => Date.now())
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null)
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const onVisibleRange = useCallback((range: { from: string; to: string }) => {
    setCalendarRange((current) => (current?.from === range.from && current?.to === range.to ? current : range))
  }, [])
  const calendar = useMappedRoomCalendar(catalogSlug, calendarRange, guestCount)
  const search = useStaySearch(
    draft.checkIn,
    draft.checkOut,
    guestCount,
    calendar.roomTypeId,
    draft.ratePlanId,
  )
  const checkout = useBookingCheckout()
  const guest = {
    firstName: draft.firstName,
    lastName: draft.lastName,
    phone: draft.phone,
    email: draft.email,
    comment: draft.comment,
  }
  const quoteReady = isQuoteFresh(search.quote, now)
  const locked = checkout.step === 'verify' || checkout.step === 'confirming' || checkout.step === 'price_changed'
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!detailsOpen) return
    const frame = window.requestAnimationFrame(() => {
      detailsRef.current?.querySelector('input')?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [detailsOpen])

  const nextRate = selectedRatePlanId(search.selectedRoom)
  if (
    (calendar.roomTypeId && calendar.roomTypeId !== draft.roomTypeId) ||
    nextRate !== draft.ratePlanId
  ) {
    setDraft((current) => ({
      ...current,
      roomTypeId: calendar.roomTypeId || current.roomTypeId,
      ratePlanId: nextRate,
    }))
  }

  useEffect(() => {
    const next = reconcileStay({
      status: calendar.status,
      hotelToday: calendar.hotelToday,
      days: calendar.days,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
    })
    if (next.checkIn === draft.checkIn && next.checkOut === draft.checkOut) return
    if (checkout.step !== 'collect' && checkout.step !== 'confirmed') {
      checkout.resetToCollect()
      setOtpCode('')
    }
    setDraft((current) => ({
      ...current,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      ratePlanId: next.checkOut ? current.ratePlanId : '',
    }))
  }, [calendar.days, calendar.hotelToday, calendar.status, checkout, draft.checkIn, draft.checkOut])

  useEffect(() => {
    if (checkout.step !== 'confirmed') return
    const token = readStoredConfirmationToken()
    if (token) navigate(`/bronuvannya/pidtverdzhennya/${encodeURIComponent(token)}`, { replace: true })
  }, [checkout.step, navigate])

  function patch(next: Partial<BookingDraft>) {
    const stayChanged =
      next.checkIn !== undefined ||
      next.checkOut !== undefined ||
      next.adults !== undefined ||
      next.children !== undefined
    if (stayChanged && checkout.step !== 'collect' && checkout.step !== 'confirmed') {
      checkout.resetToCollect()
      setOtpCode('')
    }
    setDraft((current) => {
      const merged = { ...current, ...next, roomTypeId: calendar.roomTypeId || current.roomTypeId }
      if (stayChanged && next.ratePlanId === undefined) merged.ratePlanId = ''
      return merged
    })
    setGuestErr((current) => {
      if (!current.firstName && !current.lastName && !current.phone && !current.email) return current
      return guestFieldErrors({ ...guest, ...next })
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!quoteReady || !search.configured || checkout.busy || checkout.step !== 'collect') return
    if (!detailsOpen) {
      setDetailsOpen(true)
      return
    }
    const errors = guestFieldErrors(guest)
    setGuestErr(errors)
    if (Object.keys(errors).length || !guestFormIsValid(guest)) return
    await checkout.startCheckout(search.quote, guest)
  }

  const cooldownLeft = Math.max(0, Math.ceil((checkout.cooldownUntil - now) / 1000))
  const displayQuote = checkout.pendingQuote ?? search.quote
  const canSubmit =
    quoteReady && !checkout.busy && checkout.step === 'collect' && search.configured && Boolean(calendar.roomTypeId)

  return (
    <aside className="h-fit w-full min-w-0 self-start bg-beige p-6">
      <p className="text-[0.7rem] tracking-[0.16em] uppercase">Дати</p>
      <div className="mt-4">
        <BookingCalendar
          align="end"
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          adults={draft.adults}
          kids={draft.children}
          nightPrices={search.nightPrices}
          loading={search.availabilityStatus === 'loading' || search.quoteStatus === 'loading'}
          readOnly={locked}
          live={{
            status: calendar.status,
            hotelToday: calendar.hotelToday,
            days: calendar.days,
            error: calendar.error,
            capacityNote: calendar.capacityNote,
          }}
          onVisibleRange={onVisibleRange}
          onChange={patch}
        />
      </div>

      <form noValidate onSubmit={submit}>
        <QuoteSummary
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          nights={nights}
          guestCount={guestCount}
          adults={draft.adults}
          kids={draft.children}
          room={search.selectedRoom}
          plan={search.selectedPlan}
          quote={displayQuote}
          quoteStatus={search.quoteStatus}
          quoteError={search.quoteError}
          availabilityStatus={search.availabilityStatus}
          missingRoomCopy="На ці дати ця кімната недоступна. Іншу кімнату не підставляємо."
        />
        {detailsOpen && checkout.step === 'collect' ? (
          <div ref={detailsRef} className="mt-8 border-t border-wood/15 pt-6">
            <h2 className="font-display text-3xl">Деталі гостя</h2>
            <GuestFields
              compact
              draft={draft}
              errors={guestErr}
              onChange={patch}
              onPhoneBlur={() => {
                if (!draft.phone.trim()) {
                  setGuestErr((current) => ({ ...current, phone: undefined }))
                  return
                }
                const formatted = formatBookingPhone(draft.phone)
                if (formatted) patch({ phone: formatted })
                else setGuestErr((current) => ({ ...current, phone: guestFieldErrors(guest).phone }))
              }}
              onEmailBlur={() => {
                const trimmed = draft.email.trim()
                if (trimmed !== draft.email) patch({ email: trimmed })
                setGuestErr((current) => ({
                  ...current,
                  email: guestFieldErrors({ ...guest, email: trimmed }).email,
                }))
              }}
            />
          </div>
        ) : null}
        {checkout.step === 'price_changed' && checkout.pendingQuote ? (
          <PriceChangePanel
            previousTotal={search.quote?.totalAmount}
            quote={checkout.pendingQuote}
            busy={checkout.busy}
            error={checkout.error}
            onAccept={() => checkout.acceptChangedPrice(guest)}
            onDecline={() => {
              checkout.declineChangedPrice()
              setOtpCode('')
            }}
          />
        ) : checkout.step === 'verify' || checkout.step === 'confirming' ? (
          <OtpPanel
            email={draft.email.trim()}
            code={otpCode}
            busy={checkout.busy}
            error={checkout.error}
            cooldownLeft={cooldownLeft}
            otpExpiresAt={checkout.otp?.otpExpiresAt}
            onCode={setOtpCode}
            onConfirm={() => checkout.confirmCode(otpCode)}
            onResend={() => checkout.resendCode()}
            onCorrectEmail={(email) => {
              patch({ email })
              setOtpCode('')
              void checkout.correctEmail(email)
            }}
          />
        ) : checkout.step === 'unavailable' ? (
          <div className="mt-6">
            <p className="text-sm text-clay" role="alert">
              {checkout.error || 'На ці дати немає вільних кімнат.'}
            </p>
            <button
              type="button"
              onClick={() => checkout.resetToCollect()}
              className="mt-6 w-full border border-wood/20 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
            >
              Обрати інші дати
            </button>
          </div>
        ) : (
          <>
            {checkout.error ? (
              <p className="mt-6 text-sm text-clay" role="alert">
                {checkout.error}
              </p>
            ) : null}
            {!quoteReady && search.quote ? (
              <p className="mt-4 text-sm text-clay" role="alert">
                Розрахунок застарів. Оберіть дати ще раз.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
            >
              {checkout.busy && checkout.step === 'creating_intent' ? 'Надсилаємо…' : 'Забронювати'}
            </button>
            <p className="mt-4 text-[0.72rem] text-wood/55">
              Кімната, дати й кількість гостей залишаються тими, що ви обрали. Підтвердження з’явиться
              після коду з листа.
            </p>
          </>
        )}
      </form>
    </aside>
  )
}

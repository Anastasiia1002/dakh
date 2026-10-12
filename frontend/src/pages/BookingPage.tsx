import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../components/BookingCalendar'
import {
  GuestFields,
  OtpPanel,
  PriceChangePanel,
  QuoteSummary,
  RoomOptions,
} from '../components/booking/CheckoutPanels'
import { emptyDraft, type BookingDraft } from '../lib/booking'
import { formatBookingPhone } from '../lib/phone'
import {
  guestCountOf,
  guestFieldErrors,
  guestFormIsValid,
  isQuoteFresh,
  selectedRatePlanId,
  stayNights,
  useAvailabilityCalendar,
  useBookingCheckout,
  useStaySearch,
  type GuestFieldErrors,
} from '../lib/publicBooking'
import { reconcileStay } from '../lib/publicBooking/calendar'
import { readStoredConfirmationToken } from '../lib/publicBooking/checkout'

function draftFromParams(params: URLSearchParams): BookingDraft {
  const from = params.get('from') || ''
  const to = params.get('to') && from && params.get('to')! > from ? params.get('to')! : ''
  return {
    ...emptyDraft,
    checkIn: from,
    checkOut: to,
    adults: Math.max(1, Number(params.get('adults') || 2)),
    children: Math.max(0, Number(params.get('children') || 0)),
  }
}

export function BookingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<BookingDraft>(() => draftFromParams(params))
  const [guestErr, setGuestErr] = useState<GuestFieldErrors>({})
  const [otpCode, setOtpCode] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null)
  const onVisibleRange = useCallback((range: { from: string; to: string }) => {
    setCalendarRange((current) => (current?.from === range.from && current?.to === range.to ? current : range))
  }, [])
  const calendar = useAvailabilityCalendar(calendarRange, guestCount, draft.roomTypeId)
  const search = useStaySearch(
    draft.checkIn,
    draft.checkOut,
    guestCount,
    draft.roomTypeId,
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
  const canSubmit =
    quoteReady &&
    guestFormIsValid(guest) &&
    !checkout.busy &&
    checkout.step === 'collect' &&
    search.configured

  const nextRate = selectedRatePlanId(search.selectedRoom)
  if (draft.roomTypeId && nextRate !== draft.ratePlanId) {
    setDraft((current) => ({ ...current, ratePlanId: nextRate }))
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

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
      roomTypeId: next.checkIn ? current.roomTypeId : '',
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
    const selectionChanged = next.roomTypeId !== undefined || next.ratePlanId !== undefined
    if ((stayChanged || selectionChanged) && checkout.step !== 'collect' && checkout.step !== 'confirmed') {
      checkout.resetToCollect()
      setOtpCode('')
    }
    setDraft((current) => {
      const merged = { ...current, ...next }
      if (stayChanged) {
        if (next.roomTypeId === undefined) merged.roomTypeId = ''
        if (next.ratePlanId === undefined) merged.ratePlanId = ''
      } else if (next.roomTypeId !== undefined && next.ratePlanId === undefined) {
        merged.ratePlanId = ''
      }
      return merged
    })
    setGuestErr((current) => {
      if (!current.firstName && !current.lastName && !current.phone && !current.email) return current
      return guestFieldErrors({ ...guest, ...next })
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const errors = guestFieldErrors(guest)
    setGuestErr(errors)
    if (Object.keys(errors).length || !canSubmit) return
    await checkout.startCheckout(search.quote, guest)
  }

  const cooldownLeft = Math.max(0, Math.ceil((checkout.cooldownUntil - now) / 1000))
  const displayQuote = checkout.pendingQuote ?? search.quote

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-clay">«Забронюйте свій спокій»</h1>
      <p className="mt-5 max-w-xl text-sm text-wood/70">
        Оберіть дати й кімнату. Тариф підберемо за найнижчою сумою і покажемо умови. Після заявки
        надішлемо код на пошту.
      </p>

      <p className="mt-10 text-sm text-wood/60">
        {search.searchable
          ? 'Наявність і ціна — з актуального інвентаря готелю, не з демонстраційного каталогу.'
          : 'Спочатку оберіть заїзд і виїзд. Максимум 30 ночей.'}
      </p>

      <div className="mt-4">
        <BookingCalendar
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          adults={draft.adults}
          kids={draft.children}
          nightPrices={search.nightPrices}
          loading={search.availabilityStatus === 'loading' || search.quoteStatus === 'loading'}
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

      <form noValidate onSubmit={submit} className="mt-12 grid gap-12 md:grid-cols-12">
        <div className="space-y-12 md:col-span-7">
          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Обрати кімнату</legend>
            <RoomOptions
              rooms={search.availability?.roomTypes ?? []}
              selectedId={draft.roomTypeId}
              status={search.availabilityStatus}
              error={search.availabilityError}
              searchable={search.searchable}
              onSelect={(room) =>
                patch({
                  roomTypeId: room.roomTypeId,
                  ratePlanId: selectedRatePlanId(room),
                })
              }
            />
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Деталі гостя</legend>
            <GuestFields
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
          </fieldset>
        </div>

        <aside className="h-fit bg-beige p-6 md:sticky md:top-8 md:col-span-5">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase">Ваше бронювання</p>
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
          />

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
                {checkout.busy && checkout.step === 'creating_intent'
                  ? 'Надсилаємо…'
                  : 'Надіслати на перевірку пошти'}
              </button>
              <p className="mt-4 text-[0.72rem] text-wood/55">
                Це ще не бронювання. Підтвердження з’явиться лише після коду з листа і відповіді
                сервера.
              </p>
            </>
          )}
        </aside>
      </form>
    </section>
  )
}

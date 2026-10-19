import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingCalendar } from '../BookingCalendar'
import type { AccommodationCategory } from '../../lib/catalog/categories'
import { emptyDraft, type BookingDraft } from '../../lib/booking'
import {
  guestCountOf,
  isQuoteFresh,
  selectedRatePlanId,
  stayNights,
  useStaySearch,
} from '../../lib/publicBooking'
import { BOOKING_DISABLED_COPY, isBookingEnabled } from '../../lib/publicBooking/config'
import { reconcileStay } from '../../lib/publicBooking/calendar'
import {
  saveBookingHandoff,
  handoffToSearch,
  loadBookingHandoff,
  rememberRoomDisplayName,
  type BookingHandoff,
} from '../../lib/publicBooking/handoff'
import { useMappedRoomCalendar } from '../../lib/publicBooking/useMappedRoomCalendar'
import { QuoteSummary } from './CheckoutPanels'

function draftFromHandoff(publicSlug: string): BookingDraft {
  const saved = loadBookingHandoff()
  if (!saved || saved.catalogSlug !== publicSlug) return { ...emptyDraft, adults: 2 }
  return {
    ...emptyDraft,
    checkIn: saved.checkIn,
    checkOut: saved.checkOut,
    adults: saved.adults,
    children: saved.children,
    roomTypeId: saved.roomTypeId,
    ratePlanId: saved.ratePlanId,
  }
}

export function RoomBooking({
  category,
  apiSlug,
  publicSlug,
  displayName,
  hotelSlug,
}: {
  category: AccommodationCategory
  apiSlug: string
  publicSlug: string
  displayName: string
  hotelSlug: string
}) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<BookingDraft>(() => draftFromHandoff(publicSlug))
  const [now, setNow] = useState(() => Date.now())
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null)
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const onVisibleRange = useCallback((range: { from: string; to: string }) => {
    setCalendarRange((current) => (current?.from === range.from && current?.to === range.to ? current : range))
  }, [])
  const calendar = useMappedRoomCalendar(apiSlug, calendarRange, guestCount, hotelSlug)
  const search = useStaySearch(
    draft.checkIn,
    draft.checkOut,
    guestCount,
    calendar.roomTypeId,
    draft.ratePlanId,
    hotelSlug,
    category === 'houses' ? 'COTTAGE' : 'ROOM',
  )
  const quoteReady = isQuoteFresh(search.quote, now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const nextRate = selectedRatePlanId(search.selectedRoom)
  if (search.selectedRoom && (search.selectedRoom.roomTypeId !== draft.roomTypeId || nextRate !== draft.ratePlanId)) {
    setDraft((current) => ({
      ...current,
      roomTypeId: search.selectedRoom?.roomTypeId || current.roomTypeId,
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
    setDraft((current) => ({
      ...current,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      ratePlanId: next.checkOut ? current.ratePlanId : '',
    }))
  }, [calendar.days, calendar.hotelToday, calendar.status, draft.checkIn, draft.checkOut])

  function patch(next: Partial<BookingDraft>) {
    setDraft((current) => {
      const merged = { ...current, ...next, roomTypeId: calendar.roomTypeId || current.roomTypeId }
      const stayChanged =
        next.checkIn !== undefined || next.checkOut !== undefined || next.adults !== undefined || next.children !== undefined
      if (stayChanged && next.ratePlanId === undefined) merged.ratePlanId = ''
      return merged
    })
  }

  useEffect(() => {
    if (calendar.roomTypeId && displayName) rememberRoomDisplayName(calendar.roomTypeId, displayName)
  }, [calendar.roomTypeId, displayName])

  function continueToCheckout(event: FormEvent) {
    event.preventDefault()
    if (!isBookingEnabled()) return
    if (!quoteReady || !search.quote || !calendar.roomTypeId || !search.configured) return
    const handoff: BookingHandoff = {
      hotelSlug,
      catalogSlug: publicSlug,
      roomTypeId: calendar.roomTypeId,
      roomTypeSlug: calendar.expectedSlug,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      adults: draft.adults,
      children: draft.children,
      ratePlanId: draft.ratePlanId,
      preview: {
        totalAmount: search.quote.totalAmount,
        currency: 'UAH',
      },
    }
    saveBookingHandoff(handoff)
    navigate(
      { pathname: '/bronuvannya', search: handoffToSearch(handoff).toString() },
      { state: { handoff } },
    )
  }

  const bookingEnabled = isBookingEnabled()
  const canContinue = bookingEnabled && quoteReady && Boolean(calendar.roomTypeId) && search.configured

  return (
    <aside className="h-fit w-full min-w-0 self-start border border-wood/10 bg-beige p-5 sm:p-6">
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

      <form noValidate onSubmit={continueToCheckout}>
        <QuoteSummary
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          nights={nights}
          guestCount={guestCount}
          adults={draft.adults}
          kids={draft.children}
          room={search.selectedRoom}
          plan={search.selectedPlan}
          quote={search.quote}
          quoteStatus={search.quoteStatus}
          quoteError={search.quoteError}
          availabilityStatus={search.availabilityStatus}
          availabilityError={search.availabilityError}
          roomLabel={displayName}
          missingRoomCopy="На ці дати ця кімната недоступна. Іншу кімнату не підставляємо."
        />
        {bookingEnabled ? (
          <>
            <button
              type="submit"
              disabled={!canContinue}
              className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
            >
              Забронювати
            </button>
            <p className="mt-4 text-[0.72rem] text-wood/55">
              Далі на сторінці бронювання зберемо контакти. {category === 'houses' ? 'Будинок' : 'Кімната'}, дати й гості залишаються тими, що ви
              обрали. Ціну ще раз підтвердить сервер. Оплату на сайті не приймаємо.
            </p>
          </>
        ) : (
          <p className="mt-8 text-sm leading-relaxed text-wood/70" role="status">
            {BOOKING_DISABLED_COPY}
          </p>
        )}
      </form>
    </aside>
  )
}

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatMoneyAmount } from '../../lib/format'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../BookingCalendar'
import { categorySingularLabel, type AccommodationCategory } from '../../lib/catalog/categories'
import { emptyDraft, type BookingDraft } from '../../lib/booking'
import {
  guestCountOf,
  isQuoteFresh,
  occupancyIssueForCapacity,
  roomSelectionAfterStayPatch,
  selectedRatePlanId,
  stayNights,
  useStaySearch,
} from '../../lib/publicBooking'
import { BOOKING_DISABLED_COPY, isBookingEnabled } from '../../lib/publicBooking/config'
import { calendarRejectsStay, reconcileStay } from '../../lib/publicBooking/calendar'
import {
  saveBookingHandoff,
  handoffToSearch,
  rememberRoomDisplayName,
  type BookingHandoff,
} from '../../lib/publicBooking/handoff'
import { startNewAttemptFromHandoff } from '../../lib/publicBooking/bookingDraft'
import { ResumeBookingLink } from './ResumeBookingLink'
import { stayUrlFromSearch } from '../../lib/publicBooking/stayUrl'
import { useMappedRoomCalendar } from '../../lib/publicBooking/useMappedRoomCalendar'
import { useStayGuard } from '../../lib/publicBooking/useStayGuard'
import { QuoteSummary } from './CheckoutPanels'
import { ServiceOptions } from './ServiceOptions'
import {
  loadServicesByUnit,
  loadStoredServiceQuantities,
  migrateServicesByUnit,
  persistServicesByUnit,
  selectedServiceLines,
  servicesForUnit,
  setServicesForUnit,
  SERVICE_DROPPED_COPY,
} from '../../lib/publicBooking/publicServices'
import { extrasCatalogLoaded, pruneServiceQuantities, usePublicServices } from '../../lib/publicBooking/usePublicServices'

function draftFromStayUrl(params: URLSearchParams): BookingDraft {
  const fromUrl = stayUrlFromSearch(params)
  if (fromUrl.from && fromUrl.to) {
    return {
      ...emptyDraft,
      checkIn: fromUrl.from,
      checkOut: fromUrl.to,
      adults: fromUrl.adults,
      children: fromUrl.children,
    }
  }
  return { ...emptyDraft, adults: 2 }
}

export function RoomBooking({
  category,
  apiSlug,
  publicSlug,
  displayName,
  hotelSlug,
  maxGuests,
}: {
  category: AccommodationCategory
  apiSlug: string
  publicSlug: string
  displayName: string
  hotelSlug: string
  maxGuests: number
}) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState<BookingDraft>(() => draftFromStayUrl(params))
  const [now, setNow] = useState(() => Date.now())
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null)
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const catalog = usePublicServices(hotelSlug)
  const [servicesByUnit, setServicesByUnit] = useState(() =>
    migrateServicesByUnit({
      roomTypeId: '',
      servicesByUnit: loadServicesByUnit(),
      legacyStored: loadStoredServiceQuantities(),
    }),
  )
  const [extrasNotice, setExtrasNotice] = useState('')
  const onVisibleRange = useCallback((range: { from: string; to: string }) => {
    setCalendarRange((current) => (current?.from === range.from && current?.to === range.to ? current : range))
  }, [])
  const calendar = useMappedRoomCalendar(apiSlug, calendarRange, { adults: draft.adults, children: draft.children }, hotelSlug)
  const extrasUnitId = calendar.roomTypeId || draft.roomTypeId
  const serviceQuantities = servicesForUnit(servicesByUnit, extrasUnitId)
  const serviceLines = useMemo(
    () => selectedServiceLines(serviceQuantities, catalog.items, nights),
    [catalog.items, nights, serviceQuantities],
  )
  const quoteBlocked = calendarRejectsStay({
    status: calendar.status,
    hotelToday: calendar.hotelToday,
    earliestCheckIn: calendar.earliestCheckIn,
    days: calendar.days,
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
  })
  const search = useStaySearch(
    draft.checkIn,
    draft.checkOut,
    draft.adults,
    draft.children,
    calendar.roomTypeId,
    draft.ratePlanId,
    hotelSlug,
    category === 'houses' ? 'COTTAGE' : 'ROOM',
    quoteBlocked,
    serviceLines,
  )
  const stayGuard = useStayGuard(search.stayRejection)
  const quoteReady = isQuoteFresh(search.quote, now)

  useEffect(() => {
    persistServicesByUnit(servicesByUnit)
  }, [servicesByUnit])

  useEffect(() => {
    if (!extrasCatalogLoaded(catalog.status) || !extrasUnitId) return
    setServicesByUnit((current) => {
      const selected = servicesForUnit(current, extrasUnitId)
      const next = pruneServiceQuantities(selected, catalog.items, true)
      if (next === selected) return current
      if (Object.keys(selected).length > 0) setExtrasNotice(SERVICE_DROPPED_COPY)
      return setServicesForUnit(current, extrasUnitId, next)
    })
  }, [catalog.items, catalog.status, extrasUnitId])

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
      earliestCheckIn: calendar.earliestCheckIn,
      days: calendar.days,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      blockedCheckIns: stayGuard.blockedCheckIns,
      blockedRanges: stayGuard.blockedRanges,
      roomScoped: true,
    })
    if (next.checkIn === draft.checkIn && next.checkOut === draft.checkOut) return
    setDraft((current) => ({
      ...current,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      ratePlanId: next.checkOut ? current.ratePlanId : '',
    }))
  }, [
    calendar.days,
    calendar.hotelToday,
    calendar.status,
    draft.checkIn,
    draft.checkOut,
    stayGuard.blockedCheckIns,
    stayGuard.blockedRanges,
  ])

  function patch(next: Partial<BookingDraft>) {
    if (next.checkIn !== undefined || next.checkOut !== undefined || next.adults !== undefined || next.children !== undefined) {
      stayGuard.clearNotice()
    }
    setDraft((current) => {
      const roomTypeId = calendar.roomTypeId || current.roomTypeId
      const kept = roomSelectionAfterStayPatch({
        locked: true,
        roomTypeId,
        ratePlanId: current.ratePlanId,
        next,
      })
      return { ...current, ...next, roomTypeId: kept.roomTypeId, ratePlanId: kept.ratePlanId }
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
      services: serviceQuantities,
    }
    const next = startNewAttemptFromHandoff(handoff, serviceQuantities)
    saveBookingHandoff(next)
    navigate(
      { pathname: '/bronuvannya', search: handoffToSearch(next).toString() },
      { state: { handoff: next } },
    )
  }

  const occupancyIssue = occupancyIssueForCapacity(draft.adults, maxGuests)
  const bookingEnabled = isBookingEnabled()
  const canContinue =
    bookingEnabled && quoteReady && Boolean(calendar.roomTypeId) && search.configured && !occupancyIssue
  const [panelInView, setPanelInView] = useState(true)

  useEffect(() => {
    const node = document.getElementById('booking-panel')
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setPanelInView(entry.isIntersecting), {
      threshold: 0.18,
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <aside className="h-fit w-full min-w-0 self-start border border-wood/10 bg-linen p-5 shadow-[0_18px_40px_rgba(91,56,43,0.08)] sm:p-6">
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
            earliestCheckIn: calendar.earliestCheckIn,
            days: calendar.days,
            error: calendar.error,
            capacityNote: calendar.capacityNote,
          }}
          blockedCheckIns={stayGuard.blockedCheckIns}
          blockedRanges={stayGuard.blockedRanges}
          notice={occupancyIssue || stayGuard.notice}
          maxAdults={maxGuests}
          occupancyIssue={occupancyIssue ?? undefined}
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
          fitNote={calendar.capacityNote}
          missingRoomCopy="На ці дати це розміщення недоступне. Інше не підставляємо."
        />
        {bookingEnabled && extrasNotice ? (
          <p className="mt-4 text-sm text-wood/70" role="status">
            {extrasNotice}
          </p>
        ) : null}
        {bookingEnabled ? (
          <div className="mt-6">
            <ServiceOptions
              items={catalog.items}
              status={catalog.status}
              quantities={serviceQuantities}
              onChange={(serviceId, quantity) =>
                setServicesByUnit((current) => {
                  if (!extrasUnitId) return current
                  const selected = { ...servicesForUnit(current, extrasUnitId) }
                  if (quantity == null) delete selected[serviceId]
                  else selected[serviceId] = quantity
                  return setServicesForUnit(current, extrasUnitId, selected)
                })
              }
            />
          </div>
        ) : null}
        {bookingEnabled ? (
          <>
            <button
              type="submit"
              disabled={!canContinue}
              className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
            >
              Забронювати
            </button>
            <ResumeBookingLink />
            <p className="mt-4 text-[0.72rem] text-wood/55">
              Далі на сторінці бронювання зберемо контакти. {categorySingularLabel(category)}, дати й гості залишаються тими, що ви
              обрали. Ціну ще раз підтвердить сервер.
            </p>
          </>
        ) : (
          <p className="mt-8 text-sm leading-relaxed text-wood/70" role="status">
            {BOOKING_DISABLED_COPY}
          </p>
        )}
      </form>
      {bookingEnabled && !panelInView ? (
        <a
          href="#booking-panel"
          className="pointer-events-auto fixed inset-x-4 z-30 flex min-h-12 items-center justify-between gap-3 border border-wood/10 bg-linen/95 px-4 text-sm text-wood shadow-[0_10px_28px_rgba(91,56,43,0.16)] lg:hidden"
          style={{ bottom: 'max(0.85rem, env(safe-area-inset-bottom))' }}
        >
          <span className="min-w-0 truncate">
            {quoteReady && search.quote ? formatMoneyAmount(search.quote.totalAmount) : 'Оберіть дати'}
          </span>
          <span className="shrink-0 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-clay">
            Забронювати
          </span>
        </a>
      ) : null}
    </aside>
  )
}

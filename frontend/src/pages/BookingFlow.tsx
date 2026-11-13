import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../components/BookingCalendar'
import {
  GuestFields,
  OtpPanel,
  PriceChangePanel,
  QuoteSummary,
  RoomOptions,
} from '../components/booking/CheckoutPanels'
import { ServiceOptions } from '../components/booking/ServiceOptions'
import { emptyDraft, type BookingDraft } from '../lib/booking'
import { formatMoneyAmount } from '../lib/format'
import { formatBookingPhone } from '../lib/phone'
import {
  guestCountOf,
  guestDraftFromParams,
  guestFieldErrors,
  guestFormIsValid,
  isQuoteFresh,
  offerableRatePlans,
  roomAcceptsAdults,
  roomSelectionAfterStayPatch,
  selectedRatePlanId,
  selectEligibleRatePlan,
  stayNights,
  useAvailabilityCalendar,
  useBookingCheckout,
  useStaySearch,
  type GuestFieldErrors,
} from '../lib/publicBooking'
import { selectedServiceLines } from '../lib/publicBooking/publicServices'
import { usePublicServices } from '../lib/publicBooking/usePublicServices'
import { bookingSubmitBlockReason, ROOM_SELECTION_HEADING, ROOM_SELECTION_INSTRUCTION } from '../lib/publicBooking/bookingSelection'
import { calendarRejectsStay, reconcileStay } from '../lib/publicBooking/calendar'
import { readStoredConfirmationToken } from '../lib/publicBooking/checkout'
import { acceptsBookingHotel, apiHotelSlug, bookingHotelMatchesCategory, categoryBase } from '../lib/catalog/categories'
import { BOOKING_DISABLED_COPY, isBookingEnabled, resolveHotelSlug } from '../lib/publicBooking/config'
import { publicRoomLabel } from '../lib/publicBooking/display'
import {
  clearBookingHandoff,
  handoffToSearch,
  loadBookingHandoff,
  readRoomDisplayName,
  rememberRoomDisplayName,
  resolveBookingHandoff,
  saveBookingHandoff,
  type BookingHandoff,
} from '../lib/publicBooking/handoff'
import { useMappedRoomCalendar } from '../lib/publicBooking/useMappedRoomCalendar'
import { useStayGuard } from '../lib/publicBooking/useStayGuard'
import type { PublicAvailabilityRoomType } from '../lib/publicBooking/types'

function draftFromParams(params: URLSearchParams): BookingDraft {
  const from = params.get('from') || ''
  const to = params.get('to') && from && params.get('to')! > from ? params.get('to')! : ''
  const guests = guestDraftFromParams(params.get('adults'), params.get('children'))
  return {
    ...emptyDraft,
    checkIn: from,
    checkOut: to,
    adults: guests.adults,
    children: guests.children,
  }
}

function draftFromHandoff(handoff: BookingHandoff): BookingDraft {
  return {
    ...emptyDraft,
    checkIn: handoff.checkIn,
    checkOut: handoff.checkOut,
    adults: handoff.adults,
    children: handoff.children,
    roomTypeId: handoff.roomTypeId,
    ratePlanId: handoff.ratePlanId,
  }
}

export function BookingFlow({ hideIntro = false }: { hideIntro?: boolean }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [handoff] = useState<BookingHandoff | null>(() =>
    resolveBookingHandoff({ state: location.state, params, stored: loadBookingHandoff() }),
  )
  const locked = Boolean(handoff)
  const configuredHotel = resolveHotelSlug()
  const categoryParam = params.get('category')
  const requestedCategory = categoryParam === 'houses' || categoryParam === 'rooms' ? categoryParam : null
  const category =
    requestedCategory ?? (handoff?.hotelSlug === 'sunny-park' ? 'houses' : null) ?? 'rooms'
  const hotelSlug = apiHotelSlug(category)
  const listPath = categoryBase(category)
  const [draft, setDraft] = useState<BookingDraft>(() => (handoff ? draftFromHandoff(handoff) : draftFromParams(params)))
  const [guestErr, setGuestErr] = useState<GuestFieldErrors>({})
  const [otpCode, setOtpCode] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null)
  const onVisibleRange = useCallback((range: { from: string; to: string }) => {
    setCalendarRange((current) => (current?.from === range.from && current?.to === range.to ? current : range))
  }, [])
  const party = { adults: draft.adults, children: draft.children }
  const calendar = useAvailabilityCalendar(
    locked ? null : calendarRange,
    party,
    locked ? '' : draft.roomTypeId,
    hotelSlug ?? undefined,
  )
  const mapped = useMappedRoomCalendar(
    handoff?.roomTypeSlug || handoff?.catalogSlug || '',
    locked ? calendarRange : null,
    party,
    hotelSlug ?? undefined,
  )
  const identityReady =
    !handoff ||
    (mapped.status !== 'loading' &&
      mapped.roomTypeId === handoff.roomTypeId &&
      mapped.expectedSlug === handoff.roomTypeSlug &&
      hotelSlug !== null &&
      acceptsBookingHotel(handoff.hotelSlug, configuredHotel) &&
      bookingHotelMatchesCategory(handoff.hotelSlug, category))
  const roomRejected = Boolean(handoff && mapped.status !== 'loading' && !identityReady)
  const activeCalendar = locked ? mapped : calendar
  const catalog = usePublicServices(hotelSlug ?? undefined)
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({})
  const serviceLines = useMemo(
    () => selectedServiceLines(serviceQuantities, catalog.items),
    [catalog.items, serviceQuantities],
  )
  const quoteBlocked = calendarRejectsStay({
    status: activeCalendar.status,
    hotelToday: activeCalendar.hotelToday,
    earliestCheckIn: activeCalendar.earliestCheckIn,
    days: activeCalendar.days,
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
  })
  const search = useStaySearch(
    draft.checkIn,
    draft.checkOut,
    draft.adults,
    draft.children,
    identityReady ? draft.roomTypeId : '',
    identityReady ? draft.ratePlanId : '',
    hotelSlug ?? undefined,
    category === 'houses' ? 'COTTAGE' : 'ROOM',
    quoteBlocked,
    serviceLines,
  )
  const stayGuard = useStayGuard(search.stayRejection)
  const checkout = useBookingCheckout(
    {
      roomTypeId: draft.roomTypeId,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guestCount,
      adults: draft.adults,
      children: draft.children,
    },
    hotelSlug ?? undefined,
  )
  const guest = {
    firstName: draft.firstName,
    lastName: draft.lastName,
    phone: draft.phone,
    email: draft.email,
    comment: draft.comment,
  }
  const bookingEnabled = isBookingEnabled()
  const quoteReady = isQuoteFresh(search.quote, now)
  const roomMissing =
    locked &&
    identityReady &&
    search.searchable &&
    (search.availabilityStatus === 'ready' || search.availabilityStatus === 'empty' || search.availabilityStatus === 'error') &&
    !search.selectedRoom
  const canSubmit =
    bookingEnabled &&
    quoteReady &&
    guestFormIsValid(guest) &&
    !checkout.busy &&
    checkout.step === 'collect' &&
    search.configured &&
    !roomRejected &&
    !roomMissing
  const submitBlockReason = bookingSubmitBlockReason({
    bookingEnabled,
    step: checkout.step,
    busy: checkout.busy,
    searchable: search.searchable,
    roomSelected: Boolean(draft.roomTypeId) && Boolean(search.selectedRoom),
    availabilityStatus: search.availabilityStatus,
    quoteStatus: search.quoteStatus,
    quoteReady,
    guestValid: guestFormIsValid(guest),
    roomRejected,
    roomMissing,
  })

  const nextRate = selectedRatePlanId(search.selectedRoom)
  if (identityReady && search.selectedRoom && nextRate !== draft.ratePlanId) {
    setDraft((current) => ({ ...current, ratePlanId: nextRate }))
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!handoff) return
    const stayUnchanged =
      draft.checkIn === handoff.checkIn &&
      draft.checkOut === handoff.checkOut &&
      draft.adults === handoff.adults &&
      draft.children === handoff.children
    const next: BookingHandoff = {
      ...handoff,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      adults: draft.adults,
      children: draft.children,
      roomTypeId: draft.roomTypeId || handoff.roomTypeId,
      ratePlanId: draft.ratePlanId,
      preview: stayUnchanged ? handoff.preview : null,
    }
    if (!draft.checkIn || !draft.checkOut) return
    saveBookingHandoff(next)
    const search = `?${handoffToSearch(next).toString()}`
    if (search !== location.search) {
      navigate({ pathname: '/bronuvannya', search }, { replace: true, state: { handoff: next } })
    }
  }, [draft.adults, draft.checkIn, draft.checkOut, draft.children, draft.ratePlanId, draft.roomTypeId, handoff, location.search, navigate])

  useEffect(() => {
    const next = reconcileStay({
      status: activeCalendar.status,
      hotelToday: activeCalendar.hotelToday,
      earliestCheckIn: activeCalendar.earliestCheckIn,
      days: activeCalendar.days,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      blockedCheckIns: stayGuard.blockedCheckIns,
      blockedRanges: stayGuard.blockedRanges,
      roomScoped: locked || Boolean(draft.roomTypeId),
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
      roomTypeId: locked ? current.roomTypeId : next.checkIn ? current.roomTypeId : '',
      ratePlanId: next.checkOut ? current.ratePlanId : '',
    }))
  }, [
    activeCalendar.days,
    activeCalendar.hotelToday,
    activeCalendar.status,
    checkout,
    draft.checkIn,
    draft.checkOut,
    draft.roomTypeId,
    locked,
    stayGuard.blockedCheckIns,
    stayGuard.blockedRanges,
  ])

  useEffect(() => {
    if (checkout.step !== 'confirmed') return
    clearBookingHandoff()
    const token = readStoredConfirmationToken()
    if (token) navigate('/bronuvannya/pidtverdzhennya', { replace: true })
  }, [checkout.step, navigate])

  function patch(next: Partial<BookingDraft>) {
    if (next.checkIn !== undefined || next.checkOut !== undefined || next.adults !== undefined || next.children !== undefined) {
      stayGuard.clearNotice()
    }
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
      const kept = roomSelectionAfterStayPatch({
        locked,
        roomTypeId: locked ? handoff?.roomTypeId || current.roomTypeId : current.roomTypeId,
        ratePlanId: current.ratePlanId,
        next,
      })
      merged.roomTypeId = kept.roomTypeId
      merged.ratePlanId = kept.ratePlanId
      return merged
    })
    setGuestErr((current) => {
      if (!current.firstName && !current.lastName && !current.phone && !current.email) return current
      return guestFieldErrors({ ...guest, ...next })
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!isBookingEnabled()) return
    const errors = guestFieldErrors(guest)
    setGuestErr(errors)
    if (Object.keys(errors).length || !canSubmit) return
    await checkout.startCheckout(search.quote, guest)
  }

  const cooldownLeft = Math.max(0, Math.ceil((checkout.cooldownUntil - now) / 1000))
  const displayQuote = checkout.pendingQuote ?? search.quote
  const requestedRoomLabel = handoff ? (readRoomDisplayName(handoff.roomTypeId) ?? '') : ''
  const verifiedRoomLabel = handoff && identityReady ? requestedRoomLabel : ''
  const checkingIdentity = Boolean(handoff) && !identityReady && !roomRejected

  useEffect(() => {
    if (verifiedRoomLabel && handoff) rememberRoomDisplayName(handoff.roomTypeId, verifiedRoomLabel)
    const room = search.selectedRoom
    if (!room) return
    const label = publicRoomLabel(room.name, room.kind)
    if (label) rememberRoomDisplayName(room.roomTypeId, label)
  }, [handoff, search.selectedRoom, verifiedRoomLabel])

  function labelForRoom(room: PublicAvailabilityRoomType) {
    return publicRoomLabel(room.name, room.kind)
  }

  const bookableRooms = (search.availability?.roomTypes ?? [])
    .filter(
      (room) =>
        room.kind === (category === 'houses' ? 'COTTAGE' : 'ROOM') &&
        room.availableCount > 0 &&
        roomAcceptsAdults(room, draft.adults),
    )
    .map((room) => {
      const ratePlans = offerableRatePlans(room.ratePlans)
      return {
        ...room,
        ratePlans,
        nightlyStartingPrice: selectEligibleRatePlan(ratePlans)?.nightlyStartingPrice ?? null,
      }
    })
  const roomListStatus =
    search.availabilityStatus === 'ready' && bookableRooms.length === 0 ? 'empty' : search.availabilityStatus

  const unavailableCopy = roomRejected
    ? mapped.error || 'Не вдалося підтвердити обрану кімнату. Іншу кімнату не підставляємо.'
    : roomMissing
      ? search.availabilityError || search.quoteError || 'На ці дати ця кімната недоступна. Іншу кімнату не підставляємо.'
      : ''

  return (
    <section className={hideIntro ? 'contents' : 'mx-auto max-w-6xl px-6 pb-24 pt-32'}>
      {hideIntro ? null : (
        <>
          <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-clay">«Забронюйте свій спокій»</h1>
        </>
      )}
      <p className="mt-5 max-w-xl text-sm text-wood/70">
        {bookingEnabled
          ? locked
            ? 'Помешкання вже обрано. Дати й кількість гостей можна змінити тут, потім залишіть контакти. Ціну підтверджує сервер.'
            : 'Оберіть дати й помешкання. Тариф підберемо за найнижчою сумою і покажемо умови. Після заявки надішлемо код на пошту.'
          : BOOKING_DISABLED_COPY}
      </p>

      <p className="mt-10 text-sm text-wood/60">
        {search.searchable
          ? bookingEnabled
            ? 'Оберіть дати, щоб перевірити доступність і вартість. Суму підтверджує сервер.'
            : BOOKING_DISABLED_COPY
          : 'Спочатку оберіть заїзд і виїзд. Максимум 30 ночей.'}
      </p>

      <div className="mt-4" id="stay-dates">
        <BookingCalendar
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          adults={draft.adults}
          kids={draft.children}
          nightPrices={search.nightPrices}
          loading={search.availabilityStatus === 'loading' || search.quoteStatus === 'loading'}
          live={{
            status: locked ? mapped.status : calendar.status,
            hotelToday: locked ? mapped.hotelToday : calendar.hotelToday,
            earliestCheckIn: locked ? mapped.earliestCheckIn : calendar.earliestCheckIn,
            days: locked ? mapped.days : calendar.days,
            error: locked ? mapped.error : calendar.error,
            capacityNote: locked ? mapped.capacityNote : calendar.capacityNote,
          }}
          blockedCheckIns={stayGuard.blockedCheckIns}
          blockedRanges={stayGuard.blockedRanges}
          notice={stayGuard.notice}
          onVisibleRange={onVisibleRange}
          onChange={patch}
        />
      </div>

      <form noValidate onSubmit={submit} className="mt-12 grid gap-12 md:grid-cols-12">
        <div className="space-y-12 md:col-span-7">
          {locked ? null : (
            <fieldset className="border-0 p-0">
              <legend className="font-display text-3xl text-clay">
                {ROOM_SELECTION_HEADING[category === 'houses' ? 'house' : 'room']}
              </legend>
              <p className="mt-3 max-w-xl text-sm text-wood/70">{ROOM_SELECTION_INSTRUCTION}</p>
              <RoomOptions
                rooms={bookableRooms}
                selectedId={draft.roomTypeId}
                status={roomListStatus}
                error={search.availabilityError}
                searchable={search.searchable}
                place={category === 'houses' ? 'house' : 'room'}
                roomLabel={labelForRoom}
                onSelect={(room) =>
                  patch({
                    roomTypeId: room.roomTypeId,
                    ratePlanId: selectedRatePlanId(room),
                  })
                }
              />
            </fieldset>
          )}

          {unavailableCopy ? (
            <div className="border border-clay/40 bg-beige p-5" role="alert">
              <p className="text-sm text-clay">{unavailableCopy}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#stay-dates"
                  className="inline-flex flex-1 items-center justify-center border border-wood/20 py-3 text-center text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
                >
                  Змінити дати
                </a>
                <Link
                  to={listPath}
                  onClick={() => clearBookingHandoff()}
                  className="inline-flex flex-1 items-center justify-center border border-wood/20 py-3 text-center text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
                >
                  {category === 'houses' ? 'Обрати інший будинок' : 'Обрати іншу кімнату'}
                </Link>
              </div>
            </div>
          ) : null}

          {bookingEnabled && catalog.status === 'loading' ? (
            <p className="text-sm text-wood/60">Завантажуємо додаткові послуги…</p>
          ) : null}
          {bookingEnabled && catalog.status !== 'loading' ? (
            <ServiceOptions
              items={catalog.items}
              quantities={serviceQuantities}
              onChange={(serviceId, quantity) =>
                setServiceQuantities((current) => {
                  const next = { ...current }
                  if (quantity == null) delete next[serviceId]
                  else next[serviceId] = quantity
                  return next
                })
              }
            />
          ) : null}

          {bookingEnabled ? (
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
          ) : null}
        </div>

        <aside className="h-fit bg-beige p-6 md:sticky md:top-8 md:col-span-5">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase">Ваше бронювання</p>
          {bookingEnabled && handoff?.preview && (checkingIdentity || search.quoteStatus === 'loading') ? (
            <p className="mt-4 text-sm text-wood/60">
              Попередня сума {formatMoneyAmount(handoff.preview.totalAmount)} ще перевіряється на сервері.
            </p>
          ) : null}
          <QuoteSummary
            checkIn={draft.checkIn}
            checkOut={draft.checkOut}
            nights={nights}
            guestCount={guestCount}
            adults={draft.adults}
            kids={draft.children}
            room={roomRejected || checkingIdentity ? undefined : search.selectedRoom}
            plan={roomRejected || checkingIdentity ? undefined : search.selectedPlan}
            quote={roomRejected || checkingIdentity ? null : displayQuote}
            quoteStatus={roomRejected ? 'idle' : checkingIdentity ? 'loading' : search.quoteStatus}
            quoteError={search.quoteError}
            availabilityStatus={checkingIdentity ? 'loading' : search.availabilityStatus}
            availabilityError={search.availabilityError}
            roomLabel={requestedRoomLabel || undefined}
            fitNote={activeCalendar.capacityNote}
            missingRoomCopy={
              locked
                ? 'На ці дати ця кімната недоступна. Іншу кімнату не підставляємо.'
                : 'Оберіть кімнату зі списку вільних.'
            }
          />

          {!bookingEnabled ? (
            <p className="mt-8 text-sm leading-relaxed text-wood/70" role="status">
              {BOOKING_DISABLED_COPY}
            </p>
          ) : checkout.step === 'price_changed' && checkout.pendingQuote ? (
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
          ) : checkout.step === 'looking_up' ? (
            <p className="mt-6 text-sm text-wood/70" role="status">
              Шукаємо підтвердження на сервері…
            </p>
          ) : checkout.step === 'verify' || checkout.step === 'confirming' ? (
            <OtpPanel
              email={draft.email.trim() || checkout.intent?.emailMasked || ''}
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
              {submitBlockReason ? (
                <p className="mt-4 text-sm text-wood/70" id="booking-submit-reason">
                  {submitBlockReason}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!canSubmit}
                aria-describedby={submitBlockReason ? 'booking-submit-reason' : undefined}
                className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:cursor-not-allowed disabled:bg-wood/20 disabled:text-wood/50"
              >
                {checkout.busy && checkout.step === 'creating_intent'
                  ? 'Надсилаємо…'
                  : 'Надіслати на перевірку пошти'}
              </button>
              <p className="mt-4 text-[0.72rem] text-wood/55">
                Це ще не бронювання. Підтвердження з’явиться лише після коду з листа і відповіді
                сервера. Оплату на сайті не приймаємо, картку вводити не потрібно.
              </p>
            </>
          )}
        </aside>
      </form>
    </section>
  )
}

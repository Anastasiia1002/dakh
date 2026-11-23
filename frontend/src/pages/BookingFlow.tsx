import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../components/BookingCalendar'
import { BookingReview } from '../components/booking/BookingReview'
import {
  GuestFields,
  OtpPanel,
  PriceChangePanel,
  RoomOptions,
} from '../components/booking/CheckoutPanels'
import { ServiceOptions } from '../components/booking/ServiceOptions'
import { Photo } from '../components/Photo'
import { emptyDraft, type BookingDraft } from '../lib/booking'
import { formatMoneyAmount } from '../lib/format'
import { formatBookingPhone } from '../lib/phone'
import { BookingSteps, WizardNav } from '../components/booking/BookingSteps'
import {
  guestCountOf,
  guestFieldErrors,
  guestFormIsValid,
  isQuoteFresh,
  occupancyIssueForCapacity,
  offerableRatePlans,
  roomAcceptsAdults,
  roomSelectionAfterStayPatch,
  selectedRatePlanId,
  selectEligibleRatePlan,
  stayNights,
  calendarRangeForStay,
  useAvailabilityCalendar,
  useBookingCheckout,
  useStaySearch,
  type GuestFieldErrors,
} from '../lib/publicBooking'
import {
  clearBookingDraft,
  formDraftFromStored,
  newBookingAttemptId,
  readBookingDraft,
  visibleWizardSteps,
  writeBookingDraft,
  type WizardStepId,
} from '../lib/publicBooking/bookingDraft'
import {
  migrateServicesByUnit,
  persistServicesByUnit,
  selectedServiceLines,
  servicesForUnit,
  setServicesForUnit,
  SERVICE_DROPPED_COPY,
} from '../lib/publicBooking/publicServices'
import { extrasCatalogLoaded, pruneServiceQuantities, usePublicServices } from '../lib/publicBooking/usePublicServices'
import {
  bookableAvailabilityRooms,
  bookingSubmitBlockReason,
  cottageEmptyCopy,
  groupAvailabilityRooms,
  ROOM_SELECTION_HEADING,
  ROOM_SELECTION_INSTRUCTION,
} from '../lib/publicBooking/bookingSelection'
import { mergeStayIntoSearch, stayUrlFromSearch, stayUrlMatchesDraft } from '../lib/publicBooking/stayUrl'
import { calendarRejectsStay, reconcileStay } from '../lib/publicBooking/calendar'
import { readStoredConfirmationToken } from '../lib/publicBooking/checkout'
import { acceptsBookingHotel, apiHotelSlug, bookingHotelMatchesCategory, categoryBase, categorySingularLabel, toPublicAccommodationSlug } from '../lib/catalog/categories'
import { useAccommodationList } from '../lib/catalog/useAccommodations'
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
  const stay = stayUrlFromSearch(params)
  return {
    ...emptyDraft,
    checkIn: stay.from,
    checkOut: stay.to,
    adults: stay.adults,
    children: stay.children,
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
  const storedDraft = readBookingDraft()
  const [handoff, setHandoff] = useState<BookingHandoff | null>(() => {
    const resolved = resolveBookingHandoff({ state: location.state, params, stored: loadBookingHandoff() })
    if (
      resolved &&
      storedDraft?.attemptId &&
      storedDraft.roomTypeId &&
      resolved.roomTypeId !== storedDraft.roomTypeId &&
      resolved.attemptId !== storedDraft.attemptId
    ) {
      return null
    }
    return resolved
  })
  const configuredHotel = resolveHotelSlug()
  const categoryParam = params.get('category')
  const requestedCategory = categoryParam === 'houses' || categoryParam === 'rooms' ? categoryParam : null
  const category =
    requestedCategory ?? (handoff?.hotelSlug === 'sunny-park' ? 'houses' : null) ?? 'rooms'
  const hotelSlug = apiHotelSlug(category)
  const listPath = categoryBase(category)
  const incomingAttempt = handoff?.attemptId || params.get('attempt') || ''
  const resumeSameAttempt = Boolean(
    storedDraft?.attemptId && (!incomingAttempt || storedDraft.attemptId === incomingAttempt),
  )
  const [attemptId] = useState(() => incomingAttempt || storedDraft?.attemptId || newBookingAttemptId())
  const [draft, setDraft] = useState<BookingDraft>(() => {
    if (resumeSameAttempt) {
      const fallback =
        handoff && handoff.roomTypeId === storedDraft?.roomTypeId ? draftFromHandoff(handoff) : draftFromParams(params)
      return formDraftFromStored(storedDraft, fallback, storedDraft?.attemptId)
    }
    if (handoff) return draftFromHandoff(handoff)
    return draftFromParams(params)
  })
  const [wizard, setWizard] = useState<WizardStepId>(() => {
    if (resumeSameAttempt && storedDraft?.step) return storedDraft.step
    return handoff ? 'extras' : 'dates'
  })
  const [extrasSkipped, setExtrasSkipped] = useState(() => (resumeSameAttempt ? storedDraft?.extrasSkipped === true : false))
  const [guestErr, setGuestErr] = useState<GuestFieldErrors>({})
  const [otpCode, setOtpCode] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const onVisibleRange = useCallback((range: { from: string; to: string }) => {
    setCalendarRange((current) => (current?.from === range.from && current?.to === range.to ? current : range))
  }, [])
  const onPickerOpen = useCallback((open: boolean) => setPickerOpen(open), [])
  const party = { adults: draft.adults, children: draft.children }
  const boundToHandoff = Boolean(handoff && draft.roomTypeId === handoff.roomTypeId)
  const calendar = useAvailabilityCalendar(
    boundToHandoff ? null : calendarRange,
    party,
    boundToHandoff ? '' : draft.roomTypeId,
    hotelSlug ?? undefined,
  )
  const mapped = useMappedRoomCalendar(
    handoff?.roomTypeSlug || handoff?.catalogSlug || '',
    boundToHandoff ? calendarRangeForStay(draft.checkIn, draft.checkOut, calendarRange) : null,
    party,
    hotelSlug ?? undefined,
  )
  const identityReady =
    !boundToHandoff ||
    (handoff != null &&
      mapped.status !== 'loading' &&
      mapped.roomTypeId === handoff.roomTypeId &&
      mapped.expectedSlug === handoff.roomTypeSlug &&
      hotelSlug !== null &&
      acceptsBookingHotel(handoff.hotelSlug, configuredHotel) &&
      bookingHotelMatchesCategory(handoff.hotelSlug, category))
  const roomRejected = Boolean(boundToHandoff && mapped.status !== 'loading' && !identityReady)
  const activeCalendar = boundToHandoff ? mapped : calendar
  const catalog = usePublicServices(hotelSlug ?? undefined)
  const listedRooms = useAccommodationList('rooms')
  const listedHouses = useAccommodationList('houses')
  const catalogCovers = useMemo(() => {
    const covers = new Map<string, { url: string; coverKey: string; alt: string }>()
    for (const item of [...listedRooms.items, ...listedHouses.items]) {
      if (!item.cover) continue
      const category = item.kind === 'COTTAGE' ? 'houses' : 'rooms'
      covers.set(item.id, {
        url: item.cover.url,
        coverKey: toPublicAccommodationSlug(category, item.slug),
        alt: item.cover.alt || item.name,
      })
    }
    return covers
  }, [listedHouses.items, listedRooms.items])
  const [servicesByUnit, setServicesByUnit] = useState(() =>
    migrateServicesByUnit({
      roomTypeId: storedDraft?.roomTypeId || handoff?.roomTypeId || '',
      servicesByUnit: resumeSameAttempt
        ? (storedDraft?.servicesByUnit ?? {})
        : handoff?.roomTypeId && handoff.services
          ? { [handoff.roomTypeId]: handoff.services }
          : {},
      handoffRoomTypeId: handoff?.roomTypeId,
      handoffServices: resumeSameAttempt || handoff?.attemptId === attemptId ? handoff?.services : undefined,
    }),
  )
  const serviceQuantities = servicesForUnit(servicesByUnit, draft.roomTypeId)
  const [extrasNotice, setExtrasNotice] = useState('')
  const serviceLines = useMemo(
    () => selectedServiceLines(serviceQuantities, catalog.items, nights),
    [catalog.items, nights, serviceQuantities],
  )

  useEffect(() => {
    persistServicesByUnit(servicesByUnit)
  }, [servicesByUnit])

  useEffect(() => {
    if (!extrasCatalogLoaded(catalog.status) || !draft.roomTypeId) return
    setServicesByUnit((current) => {
      const selected = servicesForUnit(current, draft.roomTypeId)
      const next = pruneServiceQuantities(selected, catalog.items, true)
      if (next === selected) return current
      if (Object.keys(selected).length > 0) setExtrasNotice(SERVICE_DROPPED_COPY)
      return setServicesForUnit(current, draft.roomTypeId, next)
    })
  }, [catalog.items, catalog.status, draft.roomTypeId])
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
    boundToHandoff ? (category === 'houses' ? 'COTTAGE' : 'ROOM') : undefined,
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
      attemptId,
    },
    hotelSlug ?? undefined,
  )

  useEffect(() => {
    writeBookingDraft({
      attemptId,
      step: wizard,
      extrasSkipped,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      adults: draft.adults,
      children: draft.children,
      hotelSlug: handoff?.hotelSlug ?? hotelSlug ?? '',
      catalogSlug: handoff?.catalogSlug ?? '',
      roomTypeId: draft.roomTypeId,
      roomTypeSlug: handoff?.roomTypeSlug ?? '',
      ratePlanId: draft.ratePlanId,
      servicesByUnit,
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      email: draft.email,
      comment: draft.comment,
      pending: checkout.intent
        ? {
            intentId: checkout.intent.intentId,
            emailMasked: checkout.intent.emailMasked,
            expiresAt: checkout.intent.expiresAt,
            cooldownUntil: checkout.cooldownUntil,
            otpExpiresAt: checkout.otp?.otpExpiresAt ?? '',
          }
        : null,
    })
  }, [
    attemptId,
    checkout.cooldownUntil,
    checkout.intent,
    checkout.otp?.otpExpiresAt,
    draft.adults,
    draft.checkIn,
    draft.checkOut,
    draft.children,
    draft.comment,
    draft.email,
    draft.firstName,
    draft.lastName,
    draft.phone,
    draft.ratePlanId,
    draft.roomTypeId,
    extrasSkipped,
    handoff,
    hotelSlug,
    servicesByUnit,
    wizard,
  ])

  useEffect(() => {
    if (checkout.step === 'verify' || checkout.step === 'confirming' || checkout.step === 'price_changed') {
      setWizard('confirm')
    }
  }, [checkout.step])

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
    boundToHandoff &&
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

  const skipStepScroll = useRef(true)
  useEffect(() => {
    if (skipStepScroll.current) {
      skipStepScroll.current = false
      return
    }
    document.getElementById('booking-active-heading')?.scrollIntoView({ block: 'start' })
  }, [wizard])

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
      attemptId: handoff.attemptId || attemptId,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      adults: draft.adults,
      children: draft.children,
      roomTypeId: draft.roomTypeId || handoff.roomTypeId,
      ratePlanId: draft.ratePlanId,
      preview: stayUnchanged ? handoff.preview : null,
      services: servicesForUnit(servicesByUnit, draft.roomTypeId || handoff.roomTypeId),
    }
    if (!draft.checkIn || !draft.checkOut) return
    if (draft.roomTypeId && draft.roomTypeId !== handoff.roomTypeId) return
    saveBookingHandoff(next)
    const search = `?${handoffToSearch(next).toString()}`
    if (search !== location.search) {
      navigate({ pathname: '/bronuvannya', search }, { replace: true, state: { handoff: next } })
    }
  }, [draft.adults, draft.checkIn, draft.checkOut, draft.children, draft.ratePlanId, draft.roomTypeId, handoff, location.search, navigate, servicesByUnit])

  useEffect(() => {
    if (handoff) return
    const stay = stayUrlFromSearch(params)
    setDraft((current) => (stayUrlMatchesDraft(stay, current) ? current : { ...current, checkIn: stay.from, checkOut: stay.to, adults: stay.adults, children: stay.children }))
  }, [handoff, params])

  useEffect(() => {
    if (handoff) return
    const merged = mergeStayIntoSearch(params, {
      from: draft.checkIn,
      to: draft.checkOut,
      adults: draft.adults,
      children: draft.children,
    })
    const next = merged.toString()
    if (next === params.toString()) return
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true })
  }, [draft.adults, draft.checkIn, draft.checkOut, draft.children, handoff, location.pathname, navigate, params])

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
      roomScoped: Boolean(draft.roomTypeId),
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
  }, [
    activeCalendar.days,
    activeCalendar.hotelToday,
    activeCalendar.status,
    checkout,
    draft.checkIn,
    draft.checkOut,
    draft.roomTypeId,
    stayGuard.blockedCheckIns,
    stayGuard.blockedRanges,
  ])

  useEffect(() => {
    if (checkout.step !== 'confirmed') return
    clearBookingDraft()
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
    const contactChanged = next.email !== undefined || next.phone !== undefined
    if ((stayChanged || selectionChanged || contactChanged) && checkout.step !== 'collect' && checkout.step !== 'confirmed') {
      checkout.resetToCollect()
      setOtpCode('')
    }
    setDraft((current) => {
      const merged = { ...current, ...next }
      const kept = roomSelectionAfterStayPatch({
        locked: Boolean(current.roomTypeId),
        roomTypeId: current.roomTypeId,
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
    const recoveringExpiredIntent = wizard === 'confirm' && checkout.step === 'collect'
    if (wizard !== 'contacts' && !recoveringExpiredIntent) {
      goNext()
      return
    }
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
  const checkingIdentity = boundToHandoff && !identityReady && !roomRejected

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

  const bookableRooms = bookableAvailabilityRooms(search.availability?.roomTypes ?? [], draft.adults, roomAcceptsAdults).map(
    (room) => {
      const ratePlans = offerableRatePlans(room.ratePlans)
      return {
        ...room,
        ratePlans,
        nightlyStartingPrice: selectEligibleRatePlan(ratePlans)?.nightlyStartingPrice ?? null,
      }
    },
  )
  const groupedRooms = groupAvailabilityRooms(bookableRooms)
  const roomListStatus =
    search.availabilityStatus === 'ready' && bookableRooms.length === 0 ? 'empty' : search.availabilityStatus

  const unavailableCopy = roomRejected
    ? mapped.error || 'Не вдалося підтвердити обране розміщення. Інше не підставляємо.'
    : roomMissing
      ? search.availabilityError || search.quoteError || 'На ці дати це розміщення недоступне. Інше не підставляємо.'
      : ''

  const lockedCapacity = [...listedRooms.items, ...listedHouses.items].find((item) => item.id === draft.roomTypeId)?.maxGuests
  const occupancyIssue = occupancyIssueForCapacity(draft.adults, lockedCapacity)
  const wizardOrder = visibleWizardSteps().map((item) => item.id)

  function selectRoom(room: PublicAvailabilityRoomType) {
    const changed = room.roomTypeId !== draft.roomTypeId
    if (changed) {
      setExtrasSkipped(false)
      if (checkout.step !== 'collect' && checkout.step !== 'confirmed') {
        checkout.resetToCollect()
        setOtpCode('')
      }
      if (handoff && handoff.roomTypeId !== room.roomTypeId) {
        clearBookingHandoff()
        setHandoff(null)
      }
    }
    patch({
      roomTypeId: room.roomTypeId,
      ratePlanId: selectedRatePlanId(room),
    })
  }

  function goBack() {
    const index = wizardOrder.indexOf(wizard)
    if (index > 0) setWizard(wizardOrder[index - 1])
  }

  function goNext() {
    if (wizard === 'dates') {
      if (!search.searchable || occupancyIssue) return
      setWizard(draft.roomTypeId ? 'extras' : 'stay')
      return
    }
    if (wizard === 'stay') {
      if (!draft.roomTypeId) return
      setWizard('extras')
      return
    }
    if (wizard === 'extras') {
      setWizard('contacts')
      return
    }
    if (wizard === 'contacts' && checkout.step === 'verify' && checkout.intent) {
      setWizard('confirm')
    }
  }

  function editFromConfirm(step: WizardStepId) {
    setWizard(step)
  }

  const codeStep = wizard === 'confirm'
  const showMobileBar =
    bookingEnabled &&
    checkout.step === 'collect' &&
    !pickerOpen &&
    wizard !== 'confirm' &&
    !codeStep
  const selectedCover = draft.roomTypeId ? catalogCovers.get(draft.roomTypeId) : undefined
  const bookingPanel = 'overflow-hidden border border-wood/10 bg-linen p-5 shadow-[0_12px_28px_rgba(91,56,43,0.08)] md:p-6'
  const extrasFromQuote = (displayQuote?.services ?? []).map((line) => ({
    serviceId: line.serviceId,
    name: line.name,
    quantity: line.quantity,
  }))
  const extrasFromDraft = catalog.items
    .filter((item) => serviceQuantities[item.id] != null)
    .map((item) => ({
      serviceId: item.id,
      name: item.name,
      quantity: serviceQuantities[item.id] ?? 0,
    }))
  const reviewExtras = extrasFromQuote.length > 0 ? extrasFromQuote : extrasFromDraft
  const extrasEntered = extrasSkipped || extrasFromDraft.length > 0
  const roomTitle =
    (search.selectedRoom ? labelForRoom(search.selectedRoom) : '') || requestedRoomLabel || 'Помешкання'
  const sending = checkout.busy && checkout.step === 'creating_intent'
  const bookDisabled =
    sending || !bookingEnabled || checkout.step !== 'collect' || roomRejected || roomMissing
  const calendarLive = boundToHandoff ? mapped : calendar
  const review = (
    <BookingReview
      roomName={roomTitle}
      cover={selectedCover}
      checkIn={draft.checkIn}
      checkOut={draft.checkOut}
      nights={nights}
      adults={draft.adults}
      children={draft.children}
      extras={reviewExtras}
      extrasEntered={extrasEntered}
      guest={guest}
      quote={roomRejected || checkingIdentity ? null : displayQuote}
      onEditStay={() => editFromConfirm('stay')}
      onEditDates={() => editFromConfirm('dates')}
      onEditExtras={() => editFromConfirm('extras')}
      onEditContacts={() => editFromConfirm('contacts')}
    />
  )

  return (
    <section className={hideIntro ? 'contents' : 'space-y-8'}>
      {hideIntro ? null : (
        <header>
          <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-clay">Бронювання</h1>
          {!bookingEnabled ? (
            <p className="mt-4 max-w-xl text-sm text-wood/70">{BOOKING_DISABLED_COPY}</p>
          ) : null}
        </header>
      )}

      {bookingEnabled ? (
        <BookingSteps active={wizard} roomSelected={Boolean(draft.roomTypeId)} />
      ) : null}

      {bookingEnabled ? (
        <details className="border border-wood/10 bg-linen md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
            <span className="font-medium">Ваше бронювання</span>
            {displayQuote && !roomRejected && !checkingIdentity ? (
              <span className="shrink-0 text-wood/70">{formatMoneyAmount(displayQuote.totalAmount)}</span>
            ) : (
              <span className="shrink-0 text-wood/50">Разом пізніше</span>
            )}
          </summary>
          <div className={`${bookingPanel} border-0 shadow-none`}>{review}</div>
        </details>
      ) : null}

      <form id="booking-form" noValidate onSubmit={submit} className={`grid items-start gap-8 md:grid-cols-12 md:gap-10 ${showMobileBar ? 'pb-28' : 'pb-8 md:pb-0'}`}>
        <div className="space-y-10 md:col-span-7">
          {wizard === 'dates' ? (
            <div id="stay-dates">
              <h2 id="booking-active-heading" className="scroll-mt-28 font-display text-3xl text-clay">Дати й гості</h2>
              <p className="mt-2 max-w-xl text-sm text-wood/70">Максимум 30 ночей.</p>
              <BookingCalendar
                checkIn={draft.checkIn}
                checkOut={draft.checkOut}
                adults={draft.adults}
                kids={draft.children}
                nightPrices={search.nightPrices}
                loading={search.availabilityStatus === 'loading' || search.quoteStatus === 'loading'}
                live={{
                  status: calendarLive.status,
                  hotelToday: calendarLive.hotelToday,
                  earliestCheckIn: calendarLive.earliestCheckIn,
                  days: calendarLive.days,
                  error: calendarLive.error,
                  capacityNote: calendarLive.capacityNote,
                }}
                blockedCheckIns={stayGuard.blockedCheckIns}
                blockedRanges={stayGuard.blockedRanges}
                notice={occupancyIssue || stayGuard.notice}
                maxAdults={lockedCapacity}
                occupancyIssue={occupancyIssue ?? undefined}
                onVisibleRange={onVisibleRange}
                onPanelChange={onPickerOpen}
                onChange={patch}
              />
              {occupancyIssue ? (
                <p className="mt-3 text-sm text-clay" role="alert">
                  {occupancyIssue}
                </p>
              ) : null}
              <WizardNav
                backHidden
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!search.searchable || Boolean(occupancyIssue)}
                nextLabel="Далі"
              />
            </div>
          ) : null}

          {wizard === 'stay' ? (
            <fieldset className="border-0 p-0">
              <legend id="booking-active-heading" className="scroll-mt-28 font-display text-3xl text-clay">
                {ROOM_SELECTION_HEADING.room}
              </legend>
              <p className="mt-3 max-w-xl text-sm text-wood/70">{ROOM_SELECTION_INSTRUCTION}</p>
              <RoomOptions
                rooms={bookableRooms}
                selectedId={draft.roomTypeId}
                status={roomListStatus}
                error={search.availabilityError}
                searchable={search.searchable}
                place="room"
                roomLabel={labelForRoom}
                covers={catalogCovers}
                emptyHouses={search.searchable && roomListStatus === 'ready' && groupedRooms.houses.length === 0}
                emptyHousesCopy={cottageEmptyCopy({ adults: draft.adults, cottages: listedHouses.items })}
                lengthStayOffers={search.availability?.lengthStayOffers}
                onSelect={selectRoom}
              />
              <WizardNav
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!draft.roomTypeId}
                nextLabel="Далі"
              />
            </fieldset>
          ) : null}

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
                  {`Обрати інший ${categorySingularLabel(category).toLowerCase()}`}
                </Link>
              </div>
            </div>
          ) : null}

          {wizard === 'extras' && bookingEnabled && extrasNotice ? (
            <p className="text-sm text-wood/70" role="status">
              {extrasNotice}
            </p>
          ) : null}

          {wizard === 'extras' && bookingEnabled && draft.roomTypeId ? (
            <>
            <ServiceOptions
              items={catalog.items}
              status={catalog.status}
              quantities={serviceQuantities}
              onChange={(serviceId, quantity) => {
                if (checkout.step !== 'collect' && checkout.step !== 'confirmed') {
                  checkout.resetToCollect()
                  setOtpCode('')
                }
                setServicesByUnit((current) => {
                  const selected = { ...servicesForUnit(current, draft.roomTypeId) }
                  if (quantity == null) delete selected[serviceId]
                  else selected[serviceId] = quantity
                  return setServicesForUnit(current, draft.roomTypeId, selected)
                })
                setExtrasSkipped(false)
              }}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-11 border border-wood/20 px-5 text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
                onClick={() => {
                  if (checkout.step !== 'collect' && checkout.step !== 'confirmed') {
                    checkout.resetToCollect()
                    setOtpCode('')
                  }
                  setExtrasSkipped(true)
                  setServicesByUnit((current) => setServicesForUnit(current, draft.roomTypeId, {}))
                  setWizard('contacts')
                }}
              >
                Пропустити послуги
              </button>
            </div>
            <WizardNav onBack={goBack} onNext={goNext} nextLabel="Далі" />
            </>
          ) : null}

          {wizard === 'contacts' && bookingEnabled ? (
          <fieldset className="border-0 p-0">
            <legend id="booking-active-heading" className="scroll-mt-28 font-display text-3xl text-clay">
              Контакти
            </legend>
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
            {checkout.step === 'collect' && checkout.error ? (
              <p className="mt-6 text-sm text-clay" role="alert">
                {checkout.error}
              </p>
            ) : null}
            <p className="mt-8 text-sm text-wood/70">Надішлемо код на вашу пошту для підтвердження бронювання.</p>
            <button
              type="submit"
              disabled={bookDisabled}
              aria-describedby={submitBlockReason ? 'booking-submit-reason' : undefined}
              className="mt-4 hidden min-h-12 w-full bg-clay py-3 text-[0.82rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:cursor-not-allowed disabled:bg-wood/20 disabled:text-wood/50 md:block"
            >
              {sending ? 'Надсилаємо…' : 'Забронювати'}
            </button>
            {submitBlockReason ? (
              <p className="mt-3 hidden text-sm text-wood/70 md:block" id="booking-submit-reason">
                {submitBlockReason}
              </p>
            ) : null}
            <div className="mt-6">
              <button
                type="button"
                onClick={goBack}
                className="min-h-11 border border-wood/20 px-5 text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
              >
                Назад
              </button>
            </div>
          </fieldset>
          ) : null}

          {codeStep ? (
            <div className="space-y-8">
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
              ) : checkout.step === 'looking_up' ? (
                <p className="text-sm text-wood/70" role="status">
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
                <div>
                  <p className="text-sm text-clay" role="alert">
                    {checkout.error || 'На ці дати немає вільних номерів або будиночків.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      checkout.resetToCollect()
                      setWizard('dates')
                    }}
                    className="mt-6 w-full border border-wood/20 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
                  >
                    Обрати інші дати
                  </button>
                </div>
              ) : (
                <div>
                  <h2 id="booking-active-heading" className="scroll-mt-28 font-display text-3xl leading-tight text-clay">
                    Підтвердіть бронювання
                  </h2>
                  <p className="mt-3 text-sm text-wood/70">Надішлемо код на вашу пошту для підтвердження бронювання.</p>
                  {checkout.error ? (
                    <p className="mt-4 text-sm text-clay" role="alert">
                      {checkout.error}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={bookDisabled}
                    className="mt-6 w-full bg-clay py-3 text-[0.82rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:cursor-not-allowed disabled:bg-wood/20 disabled:text-wood/50"
                  >
                    {sending ? 'Надсилаємо…' : 'Забронювати'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <aside className={`${bookingPanel} hidden h-fit md:sticky md:top-28 md:col-span-5 md:block`}>
          {review}
          {bookingEnabled && boundToHandoff && handoff?.preview && (checkingIdentity || search.quoteStatus === 'loading') ? (
            <p className="mt-4 text-sm text-wood/60">
              Попередня сума {formatMoneyAmount(handoff.preview.totalAmount)} ще перевіряється.
            </p>
          ) : null}
          {!bookingEnabled ? (
            <p className="mt-8 text-sm leading-relaxed text-wood/70" role="status">
              {BOOKING_DISABLED_COPY}
            </p>
          ) : !quoteReady && search.quote ? (
            <p className="mt-4 text-sm text-clay" role="alert">
              Розрахунок застарів. Оберіть дати ще раз.
            </p>
          ) : null}
        </aside>
      </form>

      {showMobileBar ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-wood/10 bg-linen/95 px-4 py-3 shadow-[0_-12px_28px_rgba(91,56,43,0.12)] backdrop-blur-sm md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
            {selectedCover ? (
              <span className="relative size-11 shrink-0 overflow-hidden bg-beige">
                <Photo
                  src={selectedCover.url}
                  alt=""
                  coverKey={selectedCover.coverKey}
                  sizes="44px"
                  className="h-full w-full"
                />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {search.selectedRoom
                  ? labelForRoom(search.selectedRoom)
                  : requestedRoomLabel || 'Оберіть помешкання'}
              </p>
              {displayQuote && !roomRejected && !checkingIdentity ? (
                <p className="text-[0.72rem] text-wood/60">{formatMoneyAmount(displayQuote.totalAmount)}</p>
              ) : null}
            </div>
            <button
              type={wizard === 'contacts' ? 'submit' : 'button'}
              form={wizard === 'contacts' ? 'booking-form' : undefined}
              onClick={wizard === 'contacts' ? undefined : goNext}
              disabled={wizard === 'contacts' ? bookDisabled : wizard === 'dates' && (!search.searchable || Boolean(occupancyIssue))}
              className="shrink-0 bg-clay px-4 py-3 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-linen disabled:cursor-not-allowed disabled:bg-wood/20 disabled:text-wood/50"
            >
              {sending ? 'Надсилаємо…' : wizard === 'contacts' ? 'Забронювати' : 'Далі'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

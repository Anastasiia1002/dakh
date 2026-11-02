import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { publicBookingClient } from './client'
import { CATALOG_MAP_MISSING_COPY } from '../catalog/categories'
import { isBookingEnabled, isPublicApiConfigured } from './config'
import { errorCopy, isAbortError, stayRejection, STAY_RANGE_COPY, type StayRejectionKind } from './errors'
import {
  availabilityMatchesSearch,
  availabilitySearchStatus,
  CAPACITY_BLOCK_COPY,
  findRatePlan,
  MISSING_PUBLIC_PRICE_COPY,
  availabilityQueryFromParty,
  guestCountOf,
  offerableRatePlans,
  publicQuoteBody,
  quoteMatchesSearch,
  quoteRequestKey,
  roomAcceptsAdults,
  shouldApplyResponse,
  shouldRequestQuote,
  stayIsSearchable,
} from './stay'
import { serviceSelectionKey } from './publicServices'
import type {
  PublicAvailabilityResponse,
  PublicAvailabilityRoomType,
  PublicQuoteResponse,
  PublicServiceSelection,
} from './types'

const EMPTY_SERVICE_LINES: readonly PublicServiceSelection[] = []

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

export type StayRejectionEvent = {
  id: number
  kind: StayRejectionKind
  message: string
  checkIn: string
  checkOut: string
  guestCount: number
}

export function useStaySearch(
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  roomTypeId: string,
  ratePlanId: string,
  hotelSlug?: string,
  kind?: 'ROOM' | 'COTTAGE',
  quoteBlocked = false,
  serviceLines: readonly PublicServiceSelection[] = EMPTY_SERVICE_LINES,
) {
  const guestCount = guestCountOf(adults, children)
  const configured = isPublicApiConfigured()
  const bookingEnabled = isBookingEnabled()
  const searchable = stayIsSearchable(checkIn, checkOut, guestCount)
  const requestedHotel = hotelSlug?.trim() ?? ''
  const hotelMissing = searchable && configured && !requestedHotel
  const availabilityKey =
    searchable && configured && requestedHotel
      ? `${requestedHotel}|${checkIn}|${checkOut}|${guestCount}|${adults}|${children}|${kind ?? ''}`
      : ''

  const latestAvailabilityKey = useRef(availabilityKey)
  const latestQuoteKey = useRef('')

  const [availability, setAvailability] = useState<PublicAvailabilityResponse | null>(null)
  const [availabilityReadyKey, setAvailabilityReadyKey] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')

  const [quote, setQuote] = useState<PublicQuoteResponse | null>(null)
  const [quoteReadyKey, setQuoteReadyKey] = useState('')
  const [quoteError, setQuoteError] = useState('')
  const [stayRejectionState, setStayRejectionState] = useState<StayRejectionEvent | null>(null)
  const rejectionSerial = useRef(0)
  const rejectedQuoteKeys = useRef(new Set<string>())

  const servicesKey = serviceSelectionKey(serviceLines)
  const search = { checkIn, checkOut, guestCount, adults, children, roomTypeId, ratePlanId, servicesKey }

  const currentAvailability =
    availabilityReadyKey === availabilityKey && availability && availabilityMatchesSearch(availability, search)
      ? availability
      : null

  const listedRoom: PublicAvailabilityRoomType | undefined = currentAvailability?.roomTypes.find(
    (room) => room.roomTypeId === roomTypeId,
  )
  const capacityBlocked = Boolean(listedRoom && !roomAcceptsAdults(listedRoom, adults))
  const selectedRoom: PublicAvailabilityRoomType | undefined = listedRoom
    ? { ...listedRoom, ratePlans: capacityBlocked ? [] : offerableRatePlans(listedRoom.ratePlans) }
    : undefined
  const selectedPlan = findRatePlan(selectedRoom, ratePlanId)
  const quoteKey =
    !quoteBlocked && searchable && configured && selectedPlan
      ? quoteRequestKey({
          hotel: requestedHotel,
          checkIn,
          checkOut,
          adults,
          children,
          roomTypeId,
          ratePlanId: selectedPlan.ratePlanId,
          kind,
          servicesKey,
        })
      : ''

  useLayoutEffect(() => {
    latestAvailabilityKey.current = availabilityKey
    latestQuoteKey.current = quoteKey
  }, [availabilityKey, quoteKey])

  useEffect(() => {
    if (!availabilityKey) return

    const requestedKey = availabilityKey
    const availabilityQuery = availabilityQueryFromParty({ checkIn, checkOut, adults, children, kind })
    if (!availabilityQuery) return
    const controller = new AbortController()
    publicBookingClient
      .availability(availabilityQuery, { signal: controller.signal }, requestedHotel)
      .then((response) => {
        if (!shouldApplyResponse(requestedKey, latestAvailabilityKey.current)) return
        setAvailability(response)
        setAvailabilityError('')
        setAvailabilityReadyKey(requestedKey)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !shouldApplyResponse(requestedKey, latestAvailabilityKey.current)) return
        const rejection = stayRejection(error)
        setAvailability(null)
        setAvailabilityError(rejection?.message ?? errorCopy(error))
        setAvailabilityReadyKey(requestedKey)
        if (rejection && rejection.kind !== 'guests') {
          rejectionSerial.current += 1
          setStayRejectionState({
            id: rejectionSerial.current,
            kind: rejection.kind,
            message: rejection.message,
            checkIn,
            checkOut,
            guestCount,
          })
        }
      })

    return () => controller.abort()
  }, [adults, availabilityKey, checkIn, checkOut, children, guestCount, kind, requestedHotel])

  useEffect(() => {
    if (!shouldRequestQuote(bookingEnabled, quoteKey) || !selectedPlan) return

    const requestedKey = quoteKey
    if (rejectedQuoteKeys.current.has(requestedKey)) {
      setQuote(null)
      setQuoteError(STAY_RANGE_COPY)
      setQuoteReadyKey(requestedKey)
      return
    }
    const body = publicQuoteBody({
      checkIn,
      checkOut,
      adults,
      children,
      roomTypeId,
      ratePlanId: selectedPlan.ratePlanId,
      services: serviceLines,
    })
    if (!body) return
    const controller = new AbortController()
    publicBookingClient
      .quote(body, { signal: controller.signal }, requestedHotel)
      .then((response) => {
        if (!shouldApplyResponse(requestedKey, latestQuoteKey.current)) return
        if (
          !quoteMatchesSearch(response, {
            checkIn,
            checkOut,
            guestCount,
            adults,
            children,
            roomTypeId,
            ratePlanId: selectedPlan.ratePlanId,
          })
        ) {
          setQuote(null)
          setQuoteError(
            serviceSelectionKey(response.services) === servicesKey
              ? 'Сервер повернув інший склад гостей. Спробуйте ще раз.'
              : 'Сервер повернув інший набір послуг. Спробуйте ще раз.',
          )
          setQuoteReadyKey(requestedKey)
          return
        }
        setQuote(response)
        setQuoteError('')
        setQuoteReadyKey(requestedKey)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !shouldApplyResponse(requestedKey, latestQuoteKey.current)) return
        const rejection = stayRejection(error)
        setQuote(null)
        setQuoteError(rejection?.message ?? errorCopy(error))
        setQuoteReadyKey(requestedKey)
        if (!rejection) return
        // A closed booking window can open later the same day. Remember only
        // stay-length failures so a refreshed eligible date can be quoted again.
        if (rejection.kind === 'range') rejectedQuoteKeys.current.add(requestedKey)
        rejectionSerial.current += 1
        setStayRejectionState({
          id: rejectionSerial.current,
          kind: rejection.kind,
          message: rejection.message,
          checkIn,
          checkOut,
          guestCount,
        })
      })

    return () => controller.abort()
  }, [adults, bookingEnabled, checkIn, checkOut, children, guestCount, quoteKey, requestedHotel, roomTypeId, selectedPlan, serviceLines, servicesKey])

  const currentQuote =
    quoteReadyKey === quoteKey && quote && quoteMatchesSearch(quote, search) ? quote : null

  const availabilityStatus: Status = availabilitySearchStatus({
    searchable,
    configured,
    settled: hotelMissing || availabilityReadyKey === availabilityKey,
    error: hotelMissing ? CATALOG_MAP_MISSING_COPY : availabilityError,
    roomCount: currentAvailability?.roomTypes.length ?? 0,
  })

  const quoteStatus: Status = !bookingEnabled || !searchable || !roomTypeId || quoteBlocked
    ? 'idle'
    : !configured
      ? 'error'
      : !selectedRoom
        ? 'idle'
        : selectedRoom.ratePlans.length === 0
          ? 'error'
          : !selectedPlan
            ? 'idle'
            : quoteReadyKey !== quoteKey
              ? 'loading'
              : quoteError
                ? 'error'
                : currentQuote
                  ? 'ready'
                  : 'idle'

  const nightPrices = useMemo(() => {
    const prices: Record<string, string> = {}
    if (!currentQuote) return prices
    for (const night of currentQuote.nights) {
      prices[night.date] = night.price
    }
    return prices
  }, [currentQuote])

  return {
    configured,
    searchable,
    availability: currentAvailability,
    availabilityStatus,
    availabilityError: configured ? availabilityError : errorCopy(new Error('PUBLIC_API_NOT_CONFIGURED')),
    selectedRoom,
    selectedPlan,
    quote: currentQuote,
    quoteStatus,
    stayRejection: stayRejectionState,
    quoteError: capacityBlocked
      ? CAPACITY_BLOCK_COPY
      : listedRoom && selectedRoom && selectedRoom.ratePlans.length === 0
        ? MISSING_PUBLIC_PRICE_COPY
        : quoteError,
    nightPrices,
  }
}

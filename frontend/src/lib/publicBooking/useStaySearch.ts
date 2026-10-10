import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { publicBookingClient } from './client'
import { isPublicApiConfigured, resolveRatePlanId } from './config'
import { errorCopy, isAbortError } from './errors'
import { availabilityMatchesSearch, quoteMatchesSearch, shouldApplyResponse, stayIsSearchable } from './stay'
import type { PublicAvailabilityResponse, PublicAvailabilityRoomType, PublicQuoteResponse } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

export function useStaySearch(checkIn: string, checkOut: string, guestCount: number, roomTypeId: string) {
  const configured = isPublicApiConfigured()
  const ratePlanId = resolveRatePlanId()
  const searchable = stayIsSearchable(checkIn, checkOut, guestCount)
  const availabilityKey = searchable && configured ? `${checkIn}|${checkOut}|${guestCount}` : ''
  const quoteKey =
    searchable && configured && ratePlanId && roomTypeId
      ? `${availabilityKey}|${roomTypeId}|${ratePlanId}`
      : ''

  const latestAvailabilityKey = useRef(availabilityKey)
  const latestQuoteKey = useRef(quoteKey)

  useLayoutEffect(() => {
    latestAvailabilityKey.current = availabilityKey
    latestQuoteKey.current = quoteKey
  }, [availabilityKey, quoteKey])

  const [availability, setAvailability] = useState<PublicAvailabilityResponse | null>(null)
  const [availabilityReadyKey, setAvailabilityReadyKey] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')

  const [quote, setQuote] = useState<PublicQuoteResponse | null>(null)
  const [quoteReadyKey, setQuoteReadyKey] = useState('')
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    if (!availabilityKey) return

    const requestedKey = availabilityKey
    const controller = new AbortController()
    publicBookingClient
      .availability({ checkIn, checkOut, guestCount }, { signal: controller.signal })
      .then((response) => {
        if (!shouldApplyResponse(requestedKey, latestAvailabilityKey.current)) return
        setAvailability(response)
        setAvailabilityError('')
        setAvailabilityReadyKey(requestedKey)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !shouldApplyResponse(requestedKey, latestAvailabilityKey.current)) return
        setAvailability(null)
        setAvailabilityError(errorCopy(error))
        setAvailabilityReadyKey(requestedKey)
      })

    return () => controller.abort()
  }, [availabilityKey, checkIn, checkOut, guestCount])

  useEffect(() => {
    if (!quoteKey || !ratePlanId) return

    const requestedKey = quoteKey
    const controller = new AbortController()
    publicBookingClient
      .quote(
        {
          checkIn,
          checkOut,
          guestCount,
          roomTypeId,
          ratePlanId,
        },
        { signal: controller.signal },
      )
      .then((response) => {
        if (!shouldApplyResponse(requestedKey, latestQuoteKey.current)) return
        setQuote(response)
        setQuoteError('')
        setQuoteReadyKey(requestedKey)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !shouldApplyResponse(requestedKey, latestQuoteKey.current)) return
        setQuote(null)
        setQuoteError(errorCopy(error))
        setQuoteReadyKey(requestedKey)
      })

    return () => controller.abort()
  }, [checkIn, checkOut, guestCount, quoteKey, ratePlanId, roomTypeId])

  const search = { checkIn, checkOut, guestCount, roomTypeId, ratePlanId }

  const currentAvailability =
    availabilityReadyKey === availabilityKey && availability && availabilityMatchesSearch(availability, search)
      ? availability
      : null

  const currentQuote =
    quoteReadyKey === quoteKey && quote && quoteMatchesSearch(quote, search) ? quote : null

  const selectedRoom: PublicAvailabilityRoomType | undefined = currentAvailability?.roomTypes.find(
    (room) => room.roomTypeId === roomTypeId,
  )

  const availabilityStatus: Status = !searchable
    ? 'idle'
    : !configured
      ? 'error'
      : availabilityReadyKey !== availabilityKey
        ? 'loading'
        : availabilityError
          ? 'error'
          : currentAvailability?.roomTypes.length
            ? 'ready'
            : 'empty'

  const quoteStatus: Status = !searchable || !roomTypeId
    ? 'idle'
    : !ratePlanId || !configured
      ? 'error'
      : !selectedRoom
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
    ratePlanId,
    searchable,
    availability: currentAvailability,
    availabilityStatus,
    availabilityError: configured ? availabilityError : errorCopy(new Error('PUBLIC_API_NOT_CONFIGURED')),
    selectedRoom,
    quote: currentQuote,
    quoteStatus,
    quoteError: !ratePlanId
      ? 'Тариф ще не налаштовано. Ціну можна порахувати після появи активного rate plan.'
      : quoteError,
    nightPrices,
  }
}

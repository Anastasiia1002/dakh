import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { publicBookingClient } from './client'
import {
  capacityExplanation,
  indexCalendarDays,
  isCalendarResponse,
  type CalendarLoadStatus,
} from './calendar'
import { isPublicApiConfigured } from './config'
import { errorCopy, isAbortError } from './errors'
import { shouldApplyResponse } from './stay'
import type { PublicCalendarDay, PublicCalendarRoomType } from './types'

export function useAvailabilityCalendar(
  range: { from: string; to: string } | null,
  guestCount: number,
  roomTypeId: string,
) {
  const configured = isPublicApiConfigured()
  const requestKey = range && configured ? `${range.from}|${range.to}|${guestCount}|${roomTypeId}` : ''
  const latestKey = useRef(requestKey)
  const [roomTypes, setRoomTypes] = useState<PublicCalendarRoomType[]>([])
  const [hotelToday, setHotelToday] = useState<string | null>(null)
  const [readyKey, setReadyKey] = useState('')
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    latestKey.current = requestKey
  }, [requestKey])

  useEffect(() => {
    if (!requestKey || !range) return
    const requestedKey = requestKey
    const controller = new AbortController()
    publicBookingClient
      .calendar(
        {
          from: range.from,
          to: range.to,
          guestCount,
          roomTypeId: roomTypeId || undefined,
        },
        { signal: controller.signal },
      )
      .then((response) => {
        if (!shouldApplyResponse(requestedKey, latestKey.current)) return
        if (!isCalendarResponse(response) || response.from !== range.from || response.to !== range.to) {
          setRoomTypes([])
          setHotelToday(null)
          setError('Не вдалося дізнатися наявність. Дати не показано як вільні.')
          setReadyKey(requestedKey)
          return
        }
        setRoomTypes(response.roomTypes)
        setHotelToday(response.hotelToday)
        setError('')
        setReadyKey(requestedKey)
      })
      .catch((reason: unknown) => {
        if (isAbortError(reason) || !shouldApplyResponse(requestedKey, latestKey.current)) return
        setRoomTypes([])
        setHotelToday(null)
        setError(errorCopy(reason))
        setReadyKey(requestedKey)
      })
    return () => controller.abort()
  }, [guestCount, range, requestKey, roomTypeId])

  const status: CalendarLoadStatus = !requestKey
    ? 'loading'
    : readyKey !== requestKey
      ? 'loading'
      : error
        ? 'error'
        : 'ready'
  const days = useMemo<Record<string, PublicCalendarDay>>(
    () => (status === 'ready' ? indexCalendarDays(roomTypes, roomTypeId) : {}),
    [roomTypeId, roomTypes, status],
  )

  return {
    status,
    hotelToday: status === 'ready' ? hotelToday : null,
    days,
    roomTypes: status === 'ready' ? roomTypes : [],
    error: status === 'error' ? error : '',
    capacityNote: status === 'ready' ? capacityExplanation(roomTypes, roomTypeId) : '',
    readyKey,
  }
}

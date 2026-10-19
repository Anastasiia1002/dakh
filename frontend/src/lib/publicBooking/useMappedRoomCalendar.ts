import { useMemo, useState } from 'react'
import { capacityExplanation, indexCalendarDays } from './calendar'
import { readRoomSlugMap } from './config'
import { findRoomTypeBySlug, resolveRoomTypeSlug } from './roomIdentity'
import type { PublicCalendarDay } from './types'
import { useAvailabilityCalendar } from './useAvailabilityCalendar'

const UNMAPPED = 'Цю кімнату не знайдено в інвентарі готелю. Іншу кімнату не підставляємо.'
const EMPTY_DAYS: Record<string, PublicCalendarDay> = {}

export function useMappedRoomCalendar(
  catalogSlug: string,
  range: { from: string; to: string } | null,
  guestCount: number,
  hotelSlug?: string,
  reloadKey = 0,
) {
  const expectedSlug = resolveRoomTypeSlug(catalogSlug, readRoomSlugMap())
  const calendar = useAvailabilityCalendar(range, guestCount, '', hotelSlug, reloadKey)
  const matched = useMemo(
    () => (calendar.status === 'ready' ? findRoomTypeBySlug(calendar.roomTypes, expectedSlug) : null),
    [calendar.roomTypes, calendar.status, expectedSlug],
  )
  const indexed = useMemo(
    () => (calendar.status === 'ready' && matched ? indexCalendarDays(calendar.roomTypes, matched.roomTypeId) : null),
    [calendar.roomTypes, calendar.status, matched],
  )
  const [held, setHeld] = useState<{
    slug: string
    id: string
    days: Record<string, PublicCalendarDay>
    hotelToday: string | null
    earliestCheckIn: string | null | undefined
  }>({
    slug: '',
    id: '',
    days: {},
    hotelToday: null,
    earliestCheckIn: undefined,
  })

  const nextId = matched?.roomTypeId ?? ''
  const nextDays = indexed ?? EMPTY_DAYS
  if (
    calendar.status === 'ready' &&
    (held.slug !== expectedSlug ||
      held.id !== nextId ||
      held.days !== nextDays ||
      held.hotelToday !== calendar.hotelToday ||
      held.earliestCheckIn !== calendar.earliestCheckIn)
  ) {
    setHeld({
      slug: expectedSlug,
      id: nextId,
      days: nextDays,
      hotelToday: calendar.hotelToday,
      earliestCheckIn: calendar.earliestCheckIn,
    })
  }

  const verified = held.slug === expectedSlug
  const roomTypeId = verified ? held.id : ''
  const unmapped = calendar.status === 'ready' && !matched
  const showingHeld = calendar.status === 'loading' && verified && Boolean(held.hotelToday)

  return {
    status: unmapped ? ('error' as const) : showingHeld ? ('ready' as const) : calendar.status,
    hotelToday: calendar.hotelToday ?? (showingHeld ? held.hotelToday : null),
    earliestCheckIn: calendar.status === 'ready' ? calendar.earliestCheckIn : showingHeld ? held.earliestCheckIn : undefined,
    days: indexed ?? (verified ? held.days : {}),
    error: unmapped ? UNMAPPED : calendar.error,
    capacityNote:
      calendar.status === 'ready' && matched ? capacityExplanation(calendar.roomTypes, matched.roomTypeId) : '',
    roomTypeId,
    expectedSlug,
  }
}

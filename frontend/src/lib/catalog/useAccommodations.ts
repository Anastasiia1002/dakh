import { useEffect, useState } from 'react'
import { publicBookingClient } from '../publicBooking/client'
import { isAbortError, isPublicApiError } from '../publicBooking/errors'
import type { PublicAccommodation, PublicHotelSlug } from '../publicBooking/types'

export type CatalogStatus = 'loading' | 'ready' | 'empty' | 'error'

export function catalogErrorCopy(error: unknown): string {
  if (isPublicApiError(error) && error.statusCode === 404) return 'Це помешкання не знайдено.'
  if (isPublicApiError(error) && error.statusCode >= 500) {
    return 'Сервер каталогу тимчасово недоступний. Спробуйте ще раз.'
  }
  return 'Не вдалося завантажити каталог. Якщо сервер щойно прокидається, спробуйте ще раз.'
}

export function useAccommodationList(hotelSlug: PublicHotelSlug) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [items, setItems] = useState<PublicAccommodation[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setError('')
    publicBookingClient
      .listAccommodations(hotelSlug, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setItems(result.accommodations)
        setStatus(result.accommodations.length > 0 ? 'ready' : 'empty')
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || isAbortError(caught)) return
        setItems([])
        setError(catalogErrorCopy(caught))
        setStatus('error')
      })
    return () => controller.abort()
  }, [hotelSlug, attempt])

  return {
    status,
    items,
    error,
    retry: () => setAttempt((value) => value + 1),
  }
}

export function useAccommodation(hotelSlug: PublicHotelSlug, slug: string) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [item, setItem] = useState<PublicAccommodation | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setItem(null)
    setError('')
    publicBookingClient
      .getAccommodation(hotelSlug, slug, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setItem(result)
        setStatus('ready')
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || isAbortError(caught)) return
        setItem(null)
        setError(catalogErrorCopy(caught))
        setStatus('error')
      })
    return () => controller.abort()
  }, [hotelSlug, slug, attempt])

  return {
    status,
    item,
    error,
    retry: () => setAttempt((value) => value + 1),
  }
}

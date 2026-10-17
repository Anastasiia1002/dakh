import { useEffect, useState } from 'react'
import { isAbortError, isPublicApiError } from '../publicBooking/errors'
import type { PublicAccommodation } from '../publicBooking/types'
import { invalidateCatalogCache, loadAccommodationList } from './cache'
import { apiHotelSlug, type AccommodationCategory } from './categories'

export type CatalogStatus = 'loading' | 'ready' | 'empty' | 'error'

export function catalogErrorCopy(error: unknown): string {
  if (isPublicApiError(error) && error.statusCode === 404) return 'Це помешкання не знайдено.'
  if (isPublicApiError(error) && error.statusCode >= 500) {
    return 'Сервер каталогу тимчасово недоступний. Спробуйте ще раз.'
  }
  return 'Не вдалося завантажити каталог. Якщо сервер щойно прокидається, спробуйте ще раз.'
}

export function useAccommodationList(category: AccommodationCategory) {
  const hotelSlug = apiHotelSlug(category)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [items, setItems] = useState<PublicAccommodation[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    setError('')
    loadAccommodationList(hotelSlug, controller.signal, attempt > 0)
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
    retry: () => {
      invalidateCatalogCache(hotelSlug)
      setAttempt((value) => value + 1)
    },
  }
}

export function useAccommodation(category: AccommodationCategory, apiSlug: string) {
  const hotelSlug = apiHotelSlug(category)
  const list = useAccommodationList(category)
  const item = list.items.find((entry) => entry.slug === apiSlug) ?? null

  let status: CatalogStatus = list.status
  if (list.status === 'ready' && !item) status = 'empty'
  if (!apiSlug) status = 'empty'

  return {
    status,
    item: status === 'ready' ? item : null,
    error: list.error,
    retry: () => {
      invalidateCatalogCache(hotelSlug)
      list.retry()
    },
  }
}

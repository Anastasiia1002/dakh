import { useEffect, useState } from 'react'
import { isAbortError, isPublicApiError } from '../publicBooking/errors'
import type { PublicAccommodation } from '../publicBooking/types'
import { invalidateCatalogCache, loadAccommodationList } from './cache'
import { accommodationsInCategory, apiHotelSlug, CATALOG_MAP_MISSING_COPY, type AccommodationCategory } from './categories'

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
    if (!hotelSlug) {
      setItems([])
      setError(CATALOG_MAP_MISSING_COPY)
      setStatus('error')
      return
    }
    const controller = new AbortController()
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    setError('')
    loadAccommodationList(hotelSlug, controller.signal, attempt > 0)
      .then((result) => {
        if (controller.signal.aborted) return
        const items = accommodationsInCategory(result.accommodations, category)
        setItems(items)
        setStatus(items.length > 0 ? 'ready' : 'empty')
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || isAbortError(caught)) return
        setItems([])
        setError(catalogErrorCopy(caught))
        setStatus('error')
      })
    return () => controller.abort()
  }, [category, hotelSlug, attempt])

  return {
    status,
    items,
    error,
    retry: () => {
      if (hotelSlug) invalidateCatalogCache(hotelSlug)
      setAttempt((value) => value + 1)
    },
  }
}

export function useAccommodation(category: AccommodationCategory, apiSlug: string) {
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
      list.retry()
    },
  }
}

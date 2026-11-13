import { useEffect, useState } from 'react'
import { publicBookingClient } from './client'
import { isBookingEnabled, isPublicApiConfigured } from './config'
import { isAbortError } from './errors'
import type { PublicServiceCatalogItem } from './types'

type CatalogState = {
  slug: string
  items: PublicServiceCatalogItem[]
  status: 'ready' | 'empty'
}

export function usePublicServices(hotelSlug: string | undefined) {
  const [state, setState] = useState<CatalogState | null>(null)
  const enabled = isBookingEnabled() && isPublicApiConfigured() && Boolean(hotelSlug)

  useEffect(() => {
    if (!enabled || !hotelSlug) return
    const controller = new AbortController()
    publicBookingClient
      .services({ signal: controller.signal }, hotelSlug)
      .then((response) => {
        const items = Array.isArray(response.items) ? response.items.filter(isCatalogItem) : []
        setState({ slug: hotelSlug, items, status: items.length > 0 ? 'ready' : 'empty' })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setState({ slug: hotelSlug, items: [], status: 'empty' })
      })
    return () => controller.abort()
  }, [enabled, hotelSlug])

  if (!enabled || !hotelSlug) return { items: [] as PublicServiceCatalogItem[], status: 'idle' as const }
  if (!state || state.slug !== hotelSlug) return { items: [] as PublicServiceCatalogItem[], status: 'loading' as const }
  return state
}

/** The public API only lists active, bookable, priced PER_STAY extras. Other CRM bases stay off the site. */
function isCatalogItem(value: PublicServiceCatalogItem): boolean {
  return Boolean(value?.id && value.name && value.currency === 'UAH' && value.chargeBasis === 'PER_STAY')
}

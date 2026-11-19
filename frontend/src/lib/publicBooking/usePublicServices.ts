import { useEffect, useState } from 'react'
import { publicBookingClient } from './client'
import { isBookingEnabled, isPublicApiConfigured } from './config'
import { isAbortError } from './errors'
import type { PublicServiceCatalogItem } from './types'

export type PublicServicesStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

type CatalogState = {
  slug: string
  items: PublicServiceCatalogItem[]
  status: Exclude<PublicServicesStatus, 'idle' | 'loading'>
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
        setState({ slug: hotelSlug, items: [], status: 'error' })
      })
    return () => controller.abort()
  }, [enabled, hotelSlug])

  if (!enabled || !hotelSlug) return { items: [] as PublicServiceCatalogItem[], status: 'idle' as const }
  if (!state || state.slug !== hotelSlug) return { items: [] as PublicServiceCatalogItem[], status: 'loading' as const }
  return state
}

/** Only extras the live public catalog can price: PER_STAY now, PER_NIGHT after that quoting ships. Other CRM units stay off the site. */
export function isCatalogItem(value: PublicServiceCatalogItem): boolean {
  return Boolean(
    value?.id &&
      value.name &&
      value.currency === 'UAH' &&
      (value.chargeBasis === 'PER_STAY' || value.chargeBasis === 'PER_NIGHT'),
  )
}

export function pruneServiceQuantities(
  quantities: Readonly<Record<string, number>>,
  catalog: readonly Pick<PublicServiceCatalogItem, 'id'>[],
) {
  const allowed = new Set(catalog.map((item) => item.id))
  let changed = false
  const next: Record<string, number> = {}
  for (const [id, quantity] of Object.entries(quantities)) {
    if (!allowed.has(id)) {
      changed = true
      continue
    }
    next[id] = quantity
  }
  return changed ? next : quantities
}

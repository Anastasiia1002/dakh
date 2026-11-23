import { formatMoneyAmount } from '../../lib/format'
import {
  guestPicksServiceQuantity,
  onlinePricingOf,
  SERVICE_EMPTY_COPY,
  SERVICE_ERROR_COPY,
  SERVICE_LOADING_COPY,
  SERVICE_SECTION_HEADING,
  SERVICE_SECTION_HINT,
  SERVICE_REQUEST_HINT,
  serviceQuantityBounds,
  serviceQuantityLabel,
  serviceUnitCopy,
} from '../../lib/publicBooking/publicServices'
import type { PublicServicesStatus } from '../../lib/publicBooking/usePublicServices'
import type { PublicServiceCatalogItem } from '../../lib/publicBooking/types'

export function ServiceOptions({
  items,
  quantities,
  status,
  onChange,
}: {
  items: readonly PublicServiceCatalogItem[]
  quantities: Readonly<Record<string, number>>
  status: PublicServicesStatus
  onChange: (serviceId: string, quantity: number | null) => void
}) {
  const listable = status === 'ready' && items.length > 0
  const hasRequest = items.some((item) => quantities[item.id] != null && onlinePricingOf(item) === 'REQUEST_ONLY')
  return (
    <fieldset className="border-0 p-0 pb-8 md:pb-0">
      <legend id="booking-active-heading" className="scroll-mt-28 font-display text-3xl text-clay">
        {SERVICE_SECTION_HEADING}
      </legend>
      {status === 'loading' || status === 'idle' ? (
        <p className="mt-3 text-sm text-wood/70">{SERVICE_LOADING_COPY}</p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-3 text-sm text-wood/70" role="status">
          {SERVICE_ERROR_COPY}
        </p>
      ) : null}
      {status === 'empty' || (status === 'ready' && items.length === 0) ? (
        <p className="mt-3 text-sm text-wood/70">{SERVICE_EMPTY_COPY}</p>
      ) : null}
      {listable ? (
        <>
          <p className="mt-3 max-w-xl text-sm text-wood/70">{SERVICE_SECTION_HINT}</p>
          <ul className="mt-6 space-y-4">
            {items.map((item) => {
              const bounds = serviceQuantityBounds(item)
              const quantity = quantities[item.id]
              const selected = quantity != null
              const quantityLabel = serviceQuantityLabel(item)
              const priced = onlinePricingOf(item) !== 'REQUEST_ONLY' && item.price
              return (
                <li
                  key={item.id}
                  className={`min-w-0 border p-4 ${selected ? 'border-clay bg-beige/40' : 'border-wood/15 bg-linen'}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{item.name}</p>
                      {item.description ? <p className="mt-1 break-words text-sm text-wood/70">{item.description}</p> : null}
                      <p className="mt-1 text-sm text-wood/70">
                        {priced && item.price
                          ? `${formatMoneyAmount(item.price)} ${serviceUnitCopy(item)}`
                          : serviceUnitCopy(item)}
                      </p>
                      {quantityLabel && selected ? (
                        <p className="mt-2 text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">{quantityLabel}</p>
                      ) : null}
                    </div>
                    {selected && guestPicksServiceQuantity(item) ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-wood/20"
                          aria-label={`Зменшити ${item.name}`}
                          onClick={() => onChange(item.id, quantity <= bounds.min ? null : quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm" aria-live="polite">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-wood/20 disabled:opacity-40"
                          aria-label={`Збільшити ${item.name}`}
                          disabled={quantity >= bounds.max}
                          onClick={() => onChange(item.id, Math.min(bounds.max, quantity + 1))}
                        >
                          +
                        </button>
                      </div>
                    ) : selected ? (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center justify-center border border-wood/20 px-4 text-[0.72rem] tracking-[0.12em] uppercase"
                        onClick={() => onChange(item.id, null)}
                      >
                        Прибрати
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center justify-center border border-wood/20 px-4 text-[0.72rem] tracking-[0.12em] uppercase"
                        onClick={() => onChange(item.id, bounds.min)}
                      >
                        Додати
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {hasRequest ? <p className="mt-3 max-w-xl text-sm text-wood/70">{SERVICE_REQUEST_HINT}</p> : null}
        </>
      ) : null}
    </fieldset>
  )
}

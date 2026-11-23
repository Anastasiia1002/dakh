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
import { bookingHeading, bookingHint } from './bookingChrome'

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
      <legend id="booking-active-heading" className={bookingHeading}>
        {SERVICE_SECTION_HEADING}
      </legend>
      {status === 'loading' || status === 'idle' ? (
        <p className={bookingHint}>{SERVICE_LOADING_COPY}</p>
      ) : null}
      {status === 'error' ? (
        <p className={bookingHint} role="status">
          {SERVICE_ERROR_COPY}
        </p>
      ) : null}
      {status === 'empty' || (status === 'ready' && items.length === 0) ? (
        <p className={bookingHint}>{SERVICE_EMPTY_COPY}</p>
      ) : null}
      {listable ? (
        <>
          <p className={bookingHint}>{SERVICE_SECTION_HINT}</p>
          <ul className="mt-7 space-y-3">
            {items.map((item) => {
              const bounds = serviceQuantityBounds(item)
              const quantity = quantities[item.id]
              const selected = quantity != null
              const quantityLabel = serviceQuantityLabel(item)
              const priced = onlinePricingOf(item) !== 'REQUEST_ONLY' && item.price
              return (
                <li
                  key={item.id}
                  className={`min-w-0 rounded-2xl border p-4 transition sm:p-5 ${
                    selected ? 'border-clay/70 bg-beige/35 shadow-[0_10px_28px_rgba(178,95,56,0.08)]' : 'border-wood/10 bg-linen'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 break-words text-[1.02rem] font-medium">
                        {selected ? (
                          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-clay text-linen" aria-hidden="true">
                            <svg viewBox="0 0 16 16" className="size-3 fill-none stroke-current stroke-[2]">
                              <path d="M3.5 8.2 6.4 11l6.1-7" />
                            </svg>
                          </span>
                        ) : null}
                        {item.name}
                      </p>
                      {item.description ? <p className="mt-1 break-words text-sm text-wood/65">{item.description}</p> : null}
                      <p className="mt-1.5 text-sm text-wood/60">
                        {priced && item.price
                          ? `${formatMoneyAmount(item.price)} ${serviceUnitCopy(item)}`
                          : serviceUnitCopy(item)}
                      </p>
                      {quantityLabel && selected ? (
                        <p className="mt-2 text-xs text-wood/50">{quantityLabel}</p>
                      ) : null}
                    </div>
                    {selected && guestPicksServiceQuantity(item) ? (
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          className="inline-flex size-11 items-center justify-center rounded-full border border-wood/15 text-lg"
                          aria-label={`Зменшити ${item.name}`}
                          onClick={() => onChange(item.id, quantity <= bounds.min ? null : quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          className="inline-flex size-11 items-center justify-center rounded-full border border-wood/15 text-lg disabled:opacity-40"
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
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-wood/15 px-5 text-sm font-medium"
                        onClick={() => onChange(item.id, null)}
                      >
                        Прибрати
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-wood px-5 text-sm font-medium text-linen"
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
          {hasRequest ? <p className="mt-4 max-w-xl text-sm text-wood/65">{SERVICE_REQUEST_HINT}</p> : null}
        </>
      ) : null}
    </fieldset>
  )
}

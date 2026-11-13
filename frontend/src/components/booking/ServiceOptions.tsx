import { formatMoneyAmount } from '../../lib/format'
import { SERVICE_CHARGE_UNIT, SERVICE_SECTION_HEADING, serviceQuantityBounds } from '../../lib/publicBooking/publicServices'
import type { PublicServiceCatalogItem } from '../../lib/publicBooking/types'

export function ServiceOptions({
  items,
  quantities,
  onChange,
}: {
  items: readonly PublicServiceCatalogItem[]
  quantities: Readonly<Record<string, number>>
  onChange: (serviceId: string, quantity: number | null) => void
}) {
  if (items.length === 0) return null

  return (
    <fieldset className="border-0 p-0 pb-8 md:pb-0">
      <legend className="font-display text-3xl text-clay">{SERVICE_SECTION_HEADING}</legend>
      <p className="mt-3 max-w-xl text-sm text-wood/70">Необов’язково. Підсумок рахує сервер.</p>
      <ul className="mt-6 space-y-4">
        {items.map((item) => {
          const bounds = serviceQuantityBounds(item)
          const quantity = quantities[item.id]
          const selected = quantity != null
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
                    {formatMoneyAmount(item.price)} {SERVICE_CHARGE_UNIT[item.chargeBasis]}
                  </p>
                </div>
                {selected ? (
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
    </fieldset>
  )
}

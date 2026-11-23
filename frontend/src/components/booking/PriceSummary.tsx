import { formatDate, formatMoneyAmount } from '../../lib/format'
import { quoteSummaryModel } from '../../lib/quotePricing'
import { SERVICE_AGREED_TOTAL_NOTE } from '../../lib/publicBooking/publicServices'
import type { PublicQuoteNight, PublicQuoteResponse, PublicQuoteServiceLine } from '../../lib/publicBooking/types'

type QuoteLike = Pick<
  PublicQuoteResponse,
  'totalAmount' | 'accommodationSubtotal' | 'discountAmount' | 'servicesTotal' | 'appliedSource' | 'appliedRule'
> & {
  nights?: readonly PublicQuoteNight[]
  services?: readonly PublicQuoteServiceLine[]
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'pt-4 text-xl font-semibold tracking-tight text-wood' : 'text-sm text-wood/75'}`}>
      <dt className="min-w-0">{label}</dt>
      <dd className="shrink-0 tabular-nums">{value}</dd>
    </div>
  )
}

export function PriceSummary({
  quote,
  nightCount,
  showNightlyDetails = true,
}: {
  quote: QuoteLike | null | undefined
  nightCount?: number
  showNightlyDetails?: boolean
}) {
  if (!quote) return null
  const model = quoteSummaryModel(quote, nightCount ?? quote.nights?.length ?? 0)
  const total = model.total ?? (typeof quote.totalAmount === 'string' ? quote.totalAmount : null)
  if (!model.accommodation && model.extras.length === 0 && !total) return null

  return (
    <div>
      <dl className="space-y-2">
        {model.accommodation ? <Row label={model.accommodationLabel} value={formatMoneyAmount(model.accommodation)} /> : null}
        {model.discount && model.discountLabel ? (
          <Row label={model.discountLabel} value={`−${formatMoneyAmount(model.discount)}`} />
        ) : null}
        {model.extras.map((line) => (
          <Row
            key={line.serviceId}
            label={line.label}
            value={line.kind === 'money' && line.amount ? formatMoneyAmount(line.amount) : line.display}
          />
        ))}
        {total ? <Row label="Разом" value={formatMoneyAmount(total)} strong /> : null}
      </dl>
      {model.hasRequestOnly ? <p className="mt-2 text-[0.72rem] text-wood/55">{SERVICE_AGREED_TOTAL_NOTE}</p> : null}
      {showNightlyDetails && model.nights.length > 0 ? (
        <details className="mt-3 border-t border-wood/10 pt-3">
          <summary className="cursor-pointer text-sm text-wood/50">
            Деталі вартості
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-wood/70">
            {model.nights.map((night) => (
              <li key={night.date} className="flex justify-between gap-4">
                <span>{formatDate(night.date)}</span>
                <span className="tabular-nums">{formatMoneyAmount(night.price)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

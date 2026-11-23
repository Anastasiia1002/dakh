import { nightCountLabel } from './ukrainian'
import { isAgreedPriceLine, isFreePriceLine, SERVICE_AGREED_PRICE_COPY, SERVICE_FREE_COPY } from './publicBooking/publicServices'
import type { PublicLengthStayOffer, PublicQuoteNight, PublicQuoteResponse, PublicQuoteServiceLine } from './publicBooking/types'

type QuoteMoneyFields = Pick<
  PublicQuoteResponse,
  'accommodationSubtotal' | 'servicesTotal' | 'discountAmount' | 'totalAmount' | 'appliedSource' | 'appliedRule'
>

const MONEY = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/

export function serverMoney(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !MONEY.test(value)) return null
  return value
}

export function positiveServerMoney(value: string | null | undefined): string | null {
  const amount = serverMoney(value)
  if (!amount) return null
  if (/^0+(?:\.0+)?$/.test(amount)) return null
  return amount
}

export function formatDiscountPercent(value: string): string {
  return value.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

export function quotePriceLines(quote: QuoteMoneyFields) {
  const accommodation = serverMoney(quote.accommodationSubtotal)
  const extras = serverMoney(quote.servicesTotal)
  const discount = positiveServerMoney(quote.discountAmount)
  const total = serverMoney(quote.totalAmount)
  const percent =
    quote.appliedSource === 'AUTOMATIC' && quote.appliedRule?.discountValue
      ? formatDiscountPercent(quote.appliedRule.discountValue)
      : null
  let discountLabel: string | null = null
  if (discount) {
    if (quote.appliedSource === 'AUTOMATIC') {
      discountLabel = percent ? `Знижка за тривалість ${percent}%` : 'Знижка за тривалість'
    } else if (quote.appliedSource === 'PROMO') {
      discountLabel = 'Промокод'
    } else {
      discountLabel = 'Знижка'
    }
  }
  return {
    accommodation,
    extras,
    discount,
    discountLabel,
    total,
  }
}

export type QuoteExtraDisplay = {
  serviceId: string
  label: string
  quantity: number
  kind: 'money' | 'free' | 'request'
  amount: string | null
  display: string
}

export function extraLineDisplay(line: PublicQuoteServiceLine): QuoteExtraDisplay {
  const quantity = Number.isInteger(line.quantity) && line.quantity > 0 ? line.quantity : 1
  const label = `${line.name} · ${quantity}`
  if (isAgreedPriceLine(line)) {
    return {
      serviceId: line.serviceId,
      label,
      quantity,
      kind: 'request',
      amount: null,
      display: SERVICE_AGREED_PRICE_COPY,
    }
  }
  if (isFreePriceLine(line)) {
    return {
      serviceId: line.serviceId,
      label,
      quantity,
      kind: 'free',
      amount: serverMoney(line.totalPrice),
      display: SERVICE_FREE_COPY,
    }
  }
  const amount = serverMoney(line.totalPrice)
  if (amount == null) {
    return {
      serviceId: line.serviceId,
      label,
      quantity,
      kind: 'request',
      amount: null,
      display: SERVICE_AGREED_PRICE_COPY,
    }
  }
  return {
    serviceId: line.serviceId,
    label,
    quantity,
    kind: 'money',
    amount,
    display: amount,
  }
}

export type QuoteSummaryModel = {
  accommodationLabel: string
  accommodation: string | null
  discount: string | null
  discountLabel: string | null
  extras: QuoteExtraDisplay[]
  total: string | null
  nights: PublicQuoteNight[]
  hasRequestOnly: boolean
}

export function quoteSummaryModel(
  quote: QuoteMoneyFields & { nights?: readonly PublicQuoteNight[]; services?: readonly PublicQuoteServiceLine[] },
  nightCount = quote.nights?.length ?? 0,
): QuoteSummaryModel {
  const lines = quotePriceLines(quote)
  const extras = (quote.services ?? []).map(extraLineDisplay)
  return {
    accommodationLabel: nightCount > 0 ? `Проживання · ${nightCountLabel(nightCount)}` : 'Проживання',
    accommodation: lines.accommodation,
    discount: lines.discount,
    discountLabel: lines.discountLabel,
    extras,
    total: lines.total,
    nights: [...(quote.nights ?? [])],
    hasRequestOnly: extras.some((line) => line.kind === 'request'),
  }
}

export function isGenericStandardPlan(plan: { name?: string; type?: string } | null | undefined) {
  if (!plan) return false
  if (plan.type && plan.type !== 'STANDARD') return false
  const title = (plan.name ?? '').trim()
  return title === '' || title === 'Стандарт' || title === 'Стандартний' || title === 'STANDARD'
}

export function lengthStayTermsCopy(offers: readonly PublicLengthStayOffer[] | undefined, kind?: 'ROOM' | 'COTTAGE') {
  if (!offers || offers.length === 0) return []
  return offers
    .filter((offer) => !kind || offer.kinds.length === 0 || offer.kinds.includes(kind))
    .map((offer) => {
      const percent = formatDiscountPercent(offer.discountValue)
      return `від ${offer.minNights} ночей −${percent}%`
    })
}

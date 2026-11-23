import type { PublicLengthStayOffer, PublicQuoteResponse } from './publicBooking/types'

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

export function lengthStayTermsCopy(offers: readonly PublicLengthStayOffer[] | undefined, kind?: 'ROOM' | 'COTTAGE') {
  if (!offers || offers.length === 0) return []
  return offers
    .filter((offer) => !kind || offer.kinds.length === 0 || offer.kinds.includes(kind))
    .map((offer) => {
      const percent = formatDiscountPercent(offer.discountValue)
      return `від ${offer.minNights} ночей −${percent}%`
    })
}

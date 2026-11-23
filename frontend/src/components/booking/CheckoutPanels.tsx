import { useState } from 'react'
import type { GuestFieldErrors } from '../../lib/publicBooking'
import {
  authoritativeStayTotal,
  rateConditions,
  rateTypeLabel,
  roomKindLabel,
  selectEligibleRatePlan,
} from '../../lib/publicBooking'
import { categoryLabel } from '../../lib/catalog/categories'
import { isBookingEnabled } from '../../lib/publicBooking/config'
import { publicPlanTitle, publicRoomLabel } from '../../lib/publicBooking/display'
import {
  COTTAGE_EMPTY_COPY,
  groupAvailabilityRooms,
  roomListPresentation,
  roomOptionFrame,
  roomOptionMark,
  type RoomPlace,
} from '../../lib/publicBooking/bookingSelection'
import { Photo } from '../Photo'
import { bookingBtnGhost, bookingBtnPrimary, bookingHeading } from './bookingChrome'
import { formatDate, formatMoneyAmount } from '../../lib/format'
import { isGenericStandardPlan, lengthStayTermsCopy } from '../../lib/quotePricing'
import { PriceSummary } from './PriceSummary'
import { guestCountLabel, partySummary } from '../../lib/ukrainian'
import type { BookingDraft } from '../../lib/booking'
import type {
  PublicAvailabilityRatePlan,
  PublicAvailabilityRoomType,
  PublicQuoteResponse,
} from '../../lib/publicBooking/types'

function fieldClass(error?: string) {
  return [
    'mt-2 w-full rounded-2xl border bg-linen px-4 py-3 font-sans text-base outline-none transition focus:ring-2 focus:ring-clay/15',
    error ? 'border-clay' : 'border-wood/12 focus:border-clay',
  ].join(' ')
}

export function OtpPanel({
  email,
  code,
  busy,
  error,
  cooldownLeft,
  otpExpiresAt,
  onCode,
  onConfirm,
  onResend,
  onCorrectEmail,
}: {
  email: string
  code: string
  busy: boolean
  error: string
  cooldownLeft: number
  otpExpiresAt?: string
  onCode: (value: string) => void
  onConfirm: () => void
  onResend: () => void
  onCorrectEmail: (email: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [nextEmail, setNextEmail] = useState(() => (email.includes('*') ? '' : email))
  function digitsFrom(value: string) {
    return value.replace(/\D/g, '').slice(0, 6)
  }

  return (
    <div>
      <h2 id="booking-active-heading" className={bookingHeading}>
        Підтвердіть бронювання
      </h2>
      <p className="mt-3 text-sm text-wood/70">
        Код надіслано на <span className="font-medium text-wood">{email || 'вказану пошту'}</span>. Бронювання ще не
        створено.
      </p>
      {editing ? (
        <div className="mt-4">
          <label className="block text-sm font-medium text-wood/70">
            Нова пошта
            <input
              type="email"
              autoComplete="email"
              value={nextEmail}
              onChange={(event) => setNextEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-wood/12 bg-linen px-4 py-3 font-sans outline-none focus:border-clay focus:ring-2 focus:ring-clay/15"
            />
          </label>
          <button
            type="button"
            disabled={busy || !nextEmail.trim()}
            onClick={() => onCorrectEmail(nextEmail.trim())}
            className={`mt-4 w-full ${bookingBtnGhost}`}
          >
            Надіслати код на цю адресу
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setNextEmail(email.includes('*') ? '' : email)
            setEditing(true)
          }}
          className="mt-3 text-sm text-clay underline-offset-4 hover:underline"
        >
          Виправити пошту
        </button>
      )}
      <label className="mt-6 block text-sm font-medium text-wood/70">
        Код з листа
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          name="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => onCode(digitsFrom(event.target.value))}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text')
            if (!pasted) return
            event.preventDefault()
            onCode(digitsFrom(pasted))
          }}
          className="mt-2 w-full rounded-2xl border border-wood/12 bg-linen px-4 py-3.5 font-sans text-xl tracking-[0.32em] outline-none focus:border-clay focus:ring-2 focus:ring-clay/15"
        />
      </label>
      {otpExpiresAt ? (
        <p className="mt-2 text-[0.72rem] text-wood/50">Код дійсний до {new Date(otpExpiresAt).toLocaleTimeString('uk-UA')}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-clay" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy || code.length !== 6}
        onClick={onConfirm}
        className={`mt-6 w-full ${bookingBtnPrimary}`}
      >
        {busy ? 'Перевіряємо…' : 'Підтвердити бронювання'}
      </button>
      <button
        type="button"
        disabled={busy || cooldownLeft > 0}
        onClick={onResend}
        className={`mt-3 w-full ${bookingBtnGhost}`}
      >
        {cooldownLeft > 0 ? `Надіслати знову через ${cooldownLeft} с` : 'Надіслати код знову'}
      </button>
    </div>
  )
}

export function PriceChangePanel({
  previousTotal,
  quote,
  busy,
  error,
  onAccept,
  onDecline,
}: {
  previousTotal?: string
  quote: PublicQuoteResponse
  busy: boolean
  error: string
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="mt-6">
      <p className="text-sm text-clay" role="alert">
        {error || 'Ціна змінилася. Підтвердіть нову суму, якщо згодні.'}
      </p>
      {previousTotal && previousTotal !== quote.totalAmount ? (
        <p className="mt-3 text-sm text-wood/60">Було {formatMoneyAmount(previousTotal)}</p>
      ) : null}
      <div className="mt-4">
        <PriceSummary quote={quote} />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onAccept}
        className={`mt-6 w-full ${bookingBtnPrimary}`}
      >
        {busy ? 'Оновлюємо…' : 'Прийняти нову ціну'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDecline}
        className={`mt-3 w-full ${bookingBtnGhost}`}
      >
        Відмовитись
      </button>
    </div>
  )
}

export function RoomOptions({
  rooms,
  selectedId,
  status,
  error,
  searchable,
  place = 'room',
  onSelect,
  roomLabel,
  covers,
  emptyHouses = false,
  emptyHousesCopy = COTTAGE_EMPTY_COPY,
  lengthStayOffers,
}: {
  rooms: PublicAvailabilityRoomType[]
  selectedId: string
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error'
  error: string
  searchable: boolean
  place?: RoomPlace
  onSelect: (room: PublicAvailabilityRoomType) => void
  roomLabel?: (room: PublicAvailabilityRoomType) => string
  covers?: Map<string, { url: string; coverKey: string; alt: string }>
  emptyHouses?: boolean
  emptyHousesCopy?: string
  lengthStayOffers?: import('../../lib/publicBooking/types').PublicLengthStayOffer[]
}) {
  const presentation = roomListPresentation({ searchable, status, error, place })
  if (presentation.state === 'need-dates' || presentation.state === 'loading') {
    return (
      <p className="mt-6 rounded-2xl border border-wood/12 bg-linen px-4 py-4 text-sm text-wood/70" role="status">
        {presentation.message}
      </p>
    )
  }
  if (presentation.state === 'error') {
    return (
      <p className="mt-6 rounded-2xl border border-clay/30 bg-beige/50 px-4 py-4 text-sm text-clay" role="alert">
        {presentation.message}
      </p>
    )
  }
  if (presentation.state === 'empty') {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-wood/25 bg-linen px-4 py-4 text-sm text-wood/70" role="status">
        {presentation.message}
      </p>
    )
  }

  const grouped = groupAvailabilityRooms(rooms)
  const split = grouped.rooms.length > 0 && grouped.houses.length > 0
  const sections = split
    ? [
        { key: 'rooms' as const, label: categoryLabel('rooms'), items: grouped.rooms },
        { key: 'houses' as const, label: categoryLabel('houses'), items: grouped.houses },
      ]
    : [{ key: 'all' as const, label: null, items: rooms }]

  return (
    <div className="mt-6 space-y-10">
      {sections.map((section) => (
        <div key={section.key}>
          {section.label ? (
            <p className="text-[0.7rem] font-medium tracking-[0.14em] uppercase text-wood/55">{section.label}</p>
          ) : null}
          <div
            className={`grid gap-5 sm:grid-cols-2 ${section.label ? 'mt-3' : ''}`}
            role="radiogroup"
            aria-label={section.label ?? (place === 'house' ? categoryLabel('houses') : 'Доступні помешкання')}
          >
            {section.items.map((room) => {
              const selected = selectedId === room.roomTypeId
              const cover = covers?.get(room.roomTypeId)
              const priced =
                isBookingEnabled() &&
                room.availableCount > 0 &&
                room.nightlyStartingPrice &&
                room.ratePlans.some((plan) => authoritativeStayTotal(plan))
              return (
                <label
                  key={room.roomTypeId}
                  className={`cursor-pointer overflow-hidden rounded-2xl ${roomOptionFrame(selected)}`}
                  onClick={() => {
                    if (!selected) onSelect(room)
                  }}
                >
                  <input
                    type="radio"
                    name="roomType"
                    value={room.roomTypeId}
                    checked={selected}
                    onChange={() => onSelect(room)}
                    className="sr-only"
                  />
                  <span className="pointer-events-none relative block aspect-[4/3] overflow-hidden bg-beige">
                    {cover ? (
                      <Photo
                        src={cover.url}
                        alt=""
                        coverKey={cover.coverKey}
                        priority={false}
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="absolute inset-0 h-full w-full"
                      />
                    ) : (
                      <span className="flex h-full w-full items-end px-4 py-3 text-[0.62rem] font-medium tracking-[0.12em] uppercase text-wood/55">
                        {roomKindLabel(room.kind)}
                      </span>
                    )}
                    <span
                      className={`absolute right-3 top-3 bg-linen/95 px-2 py-1 text-[0.62rem] tracking-[0.14em] uppercase ${
                        selected ? 'text-clay' : 'text-wood/55'
                      }`}
                    >
                      {roomOptionMark(selected)}
                    </span>
                  </span>
                  <span className="block p-4">
                    <span className="kicker block text-[0.68rem] text-clay">{roomKindLabel(room.kind)}</span>
                    <span className="mt-1 block font-display text-2xl leading-[1.12]">
                      {roomLabel?.(room) ?? publicRoomLabel(room.name, room.kind)}
                    </span>
                    <span className="mt-2 block text-sm text-wood/70">
                      до {room.maxGuests} {room.maxGuests === 1 ? 'гостя' : 'гостей'} · вільних {room.availableCount}
                    </span>
                    {priced && room.nightlyStartingPrice ? (
                      <span className="mt-3 block font-display text-2xl text-clay">
                        від {formatMoneyAmount(room.nightlyStartingPrice)}
                        <span className="ml-1 text-sm font-sans font-normal tracking-normal text-wood/55">/ доба</span>
                      </span>
                    ) : null}
                    {lengthStayTermsCopy(lengthStayOffers, room.kind).map((term) => (
                      <span key={term} className="mt-1 block text-[0.72rem] text-wood/60">
                        {term}
                      </span>
                    ))}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
      {emptyHouses ? (
        <p className="border border-dashed border-wood/30 bg-linen px-4 py-4 text-sm text-wood/70" role="status">
          {emptyHousesCopy}
        </p>
      ) : null}
    </div>
  )
}

export function RatePlanOptions({
  room,
  selectedId,
  availabilityStatus,
  onSelect,
}: {
  room?: PublicAvailabilityRoomType
  selectedId: string
  availabilityStatus: 'idle' | 'loading' | 'ready' | 'empty' | 'error'
  onSelect: (ratePlanId: string) => void
}) {
  if (availabilityStatus === 'loading') {
    return <p className="mt-6 text-sm text-wood/60">Шукаємо тарифи…</p>
  }
  if (!room) {
    return <p className="mt-6 text-sm text-wood/60">Спочатку оберіть номер або будиночок.</p>
  }
  if (room.ratePlans.length === 0) {
    return (
      <p className="mt-6 text-sm text-wood/70">
        Для цього розміщення на обрані дати немає доступного тарифу. Ціну не рахуємо і заявку надіслати
        не можна.
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {room.ratePlans.map((plan) => (
        <label
          key={plan.ratePlanId}
          className={`block cursor-pointer border p-3 ${
            selectedId === plan.ratePlanId ? 'border-clay' : 'border-wood/15'
          }`}
        >
          <input
            type="radio"
            name="ratePlan"
            value={plan.ratePlanId}
            checked={selectedId === plan.ratePlanId}
            onChange={() => onSelect(plan.ratePlanId)}
            className="sr-only"
          />
          <span className="block font-medium">{publicPlanTitle(plan)}</span>
          <span className="mt-1 block text-sm text-wood/60">
            {rateTypeLabel(plan.type)}
            {isBookingEnabled() && authoritativeStayTotal(plan)
              ? ` · попередньо ${formatMoneyAmount(plan.totalAmount)}`
              : ' · суму не показуємо'}
          </span>
        </label>
      ))}
    </div>
  )
}

export function QuoteSummary({
  checkIn,
  checkOut,
  nights,
  guestCount,
  adults,
  kids,
  room,
  plan,
  quote,
  quoteStatus,
  quoteError,
  missingRoomCopy = 'Оберіть номер або будиночок зі списку вільних.',
  availabilityStatus,
  availabilityError = '',
  roomLabel,
  fitNote = '',
  cover,
  variant = 'compact',
}: {
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  adults: number
  kids: number
  room?: PublicAvailabilityRoomType
  plan?: PublicAvailabilityRatePlan
  quote: PublicQuoteResponse | null
  quoteStatus: 'idle' | 'loading' | 'ready' | 'error' | 'empty'
  quoteError: string
  missingRoomCopy?: string
  availabilityStatus?: 'idle' | 'loading' | 'ready' | 'empty' | 'error'
  availabilityError?: string
  roomLabel?: string
  /** The selected room cannot hold this party. Dates stay selected. */
  fitNote?: string
  cover?: { url: string; coverKey: string; alt: string }
  variant?: 'compact' | 'full'
}) {
  const roomName = room ? publicRoomLabel(room.name, room.kind, roomLabel) : roomLabel
  const guests = partySummary(adults, kids)
  const coverFrame = cover ? (
    <div className={`relative overflow-hidden bg-beige ${variant === 'full' ? 'mb-4 aspect-[5/3]' : 'mb-4 h-16 w-24'}`}>
      <Photo
        src={cover.url}
        alt=""
        coverKey={cover.coverKey}
        sizes={variant === 'full' ? '(max-width: 768px) 100vw, 40vw' : '96px'}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  ) : null
  const cancellation = plan ? rateConditions(plan.type) : ''
  const showPlanTitle = Boolean(plan && !isGenericStandardPlan({ name: publicPlanTitle(plan), type: plan.type }))
  if (!checkIn || !checkOut || nights < 1) {
    return (
      <div className="mt-6 text-sm">
        {roomName ? <p className="font-medium">{roomName}</p> : null}
        <p className={roomName ? 'mt-2 text-wood/60' : 'text-wood/60'}>Оберіть заїзд і виїзд.</p>
      </div>
    )
  }
  if (!room) {
    if (availabilityStatus === 'loading') {
      return (
        <div className="mt-6 text-sm">
          {roomName ? <p className="font-medium">{roomName}</p> : null}
          <p className="mt-2 text-wood/60">Перевіряємо наявність цього розміщення…</p>
        </div>
      )
    }
    if (availabilityStatus === 'error') {
      return (
        <p className="mt-6 text-sm text-clay" role="alert">
          {availabilityError || 'Не вдалося зв’язатися з сервером бронювання.'}
        </p>
      )
    }
    if (fitNote) {
      return (
        <div className="mt-6 text-sm leading-relaxed text-wood/70">
          {roomName ? <p className="font-medium">{roomName}</p> : null}
          <p className={roomName ? 'mt-2' : undefined}>
            {formatDate(checkIn)} — {formatDate(checkOut)} · {nights} н. · {guests}
          </p>
          <p className="mt-2">{fitNote}</p>
          <p className="mt-2">Дати заїзду й виїзду залишаються. Зменшіть кількість гостей або оберіть інше помешкання.</p>
        </div>
      )
    }
    if (availabilityStatus === 'empty') {
      return (
        <p className="mt-6 text-sm text-wood/70">
          На обрані дати немає доступних пропозицій. Спробуйте інший період.
        </p>
      )
    }
    return (
      <div className="mt-6 text-sm">
        {roomName ? <p className="font-medium">{roomName}</p> : null}
        <p className="mt-2 text-wood/60">{missingRoomCopy}</p>
      </div>
    )
  }
  if (room.availableCount < 1 || room.ratePlans.length === 0) {
    return (
      <div className="mt-6 text-sm leading-relaxed text-wood/70">
        <p className="font-medium">{roomName}</p>
        <p className="mt-2">
          {formatDate(checkIn)} — {formatDate(checkOut)} · {nights} н. · {guestCountLabel(guestCount)}
        </p>
        <p className="mt-2">
          {room.availableCount < 1
            ? 'На ці дати це розміщення недоступне. Інше не підставляємо.'
            : 'На ці дати немає повного тарифу. Суму не показуємо і забронювати не можна.'}
        </p>
      </div>
    )
  }
  if (!isBookingEnabled()) {
    const priced =
      (plan && authoritativeStayTotal(plan) ? plan : null) ??
      selectEligibleRatePlan(room.ratePlans.filter((item) => authoritativeStayTotal(item)))
    const total = authoritativeStayTotal(priced)
    if (!priced || !total) {
      return (
        <div className="mt-6 text-sm leading-relaxed text-wood/70">
          <p className="font-medium">{roomName}</p>
          <p className="mt-2">
            {formatDate(checkIn)} — {formatDate(checkOut)} · {nights} н. · {guestCountLabel(guestCount)}
          </p>
          <p className="mt-2">На ці дати немає повної суми за проживання. Тестову ціну не показуємо.</p>
        </div>
      )
    }
    return (
      <div className="mt-6 text-sm leading-relaxed">
        <p className="font-medium">{roomName}</p>
        {isGenericStandardPlan({ name: publicPlanTitle(priced), type: priced.type }) ? null : (
          <p className="mt-1 text-wood/70">{publicPlanTitle(priced)}</p>
        )}
        <details className="mt-2 text-wood/70">
          <summary className="cursor-pointer text-[0.72rem] tracking-[0.08em] uppercase text-wood/55">
            Умови скасування
          </summary>
          <p className="mt-2">{rateConditions(priced.type)}</p>
        </details>
        <p className="mt-2 text-wood/70">
          {formatDate(checkIn)} — {formatDate(checkOut)}
        </p>
        <p className="mt-1 text-wood/70">
          {guests} · {nights} н. · вільних {room.availableCount}
        </p>
        <p className="mt-6 text-xl font-semibold tabular-nums text-wood">{formatMoneyAmount(total)}</p>
        <p className="mt-2 text-[0.72rem] text-wood/55">
          Тестова ціна за обрані дати, {priced.currency}. Це сума з сервера, не орієнтир каталогу і не підтверджене
          бронювання.
        </p>
      </div>
    )
  }
  if (!plan && !quote) {
    return <p className="mt-6 text-sm text-wood/60">Підбираємо умови проживання…</p>
  }
  if (quoteStatus === 'loading' && !quote) {
    return <p className="mt-6 text-sm text-wood/60">Рахуємо вартість…</p>
  }
  if (quoteStatus === 'error' && !quote) {
    return (
      <p className="mt-6 text-sm text-clay" role="alert">
        {quoteError}
      </p>
    )
  }
  if (!quote) {
    return <p className="mt-6 text-sm text-wood/60">Оберіть дати й розміщення.</p>
  }

  return (
    <div className="mt-4 text-sm leading-relaxed">
      {coverFrame}
      <p className="font-medium leading-snug">{roomName}</p>
        {plan && showPlanTitle ? <p className="mt-1 text-wood/70">{publicPlanTitle(plan)}</p> : null}
      <p className="mt-2 text-wood/70">
        {formatDate(quote.checkIn)} — {formatDate(quote.checkOut)}
      </p>
      <p className="mt-1 text-wood/70">
        {guests} · {quote.nights.length} н.
      </p>
      <div className="mt-4 border-t border-wood/10 pt-4">
        <PriceSummary quote={quote} nightCount={quote.nights.length} />
      </div>
      {plan && cancellation ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-[0.72rem] tracking-[0.08em] uppercase text-wood/55">
            Умови скасування
          </summary>
          <p className="mt-2 text-wood/70">{cancellation}</p>
        </details>
      ) : null}
      <p className="mt-3 text-[0.72rem] text-wood/55">Це ще не підтверджене бронювання.</p>
    </div>
  )
}

export function GuestFields({
  draft,
  errors,
  onChange,
  onPhoneBlur,
  onEmailBlur,
  compact = false,
}: {
  draft: Pick<BookingDraft, 'firstName' | 'lastName' | 'phone' | 'email' | 'comment'>
  errors: GuestFieldErrors
  onChange: (next: Partial<BookingDraft>) => void
  onPhoneBlur: () => void
  onEmailBlur: () => void
  compact?: boolean
}) {
  return (
    <div>
      <p className="mt-2 text-sm text-wood/70">
        Ім’я, прізвище і телефон обов’язкові. Для України достатньо номера на 095…, для інших країн почніть з +.
      </p>
      <div className={`mt-6 grid gap-6 ${compact ? '' : 'md:grid-cols-2'}`}>
        <label className="text-sm font-medium text-wood/70">
          Ім’я *
          <input
            autoComplete="given-name"
            value={draft.firstName}
            aria-invalid={Boolean(errors.firstName)}
            onChange={(event) => onChange({ firstName: event.target.value })}
            className={fieldClass(errors.firstName)}
          />
          {errors.firstName ? (
            <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
              {errors.firstName}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium text-wood/70">
          Прізвище *
          <input
            autoComplete="family-name"
            value={draft.lastName}
            aria-invalid={Boolean(errors.lastName)}
            onChange={(event) => onChange({ lastName: event.target.value })}
            className={fieldClass(errors.lastName)}
          />
          {errors.lastName ? (
            <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
              {errors.lastName}
            </span>
          ) : null}
        </label>
      </div>
      <div className="mt-6 grid gap-6">
        <label className="text-sm font-medium text-wood/70">
          Телефон *
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="+380"
            value={draft.phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => onChange({ phone: event.target.value })}
            onBlur={onPhoneBlur}
            className={fieldClass(errors.phone)}
          />
          {errors.phone ? (
            <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
              {errors.phone}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium text-wood/70">
          Пошта *
          <input
            type="email"
            autoComplete="email"
            placeholder="name@email.com"
            value={draft.email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => onChange({ email: event.target.value })}
            onBlur={onEmailBlur}
            className={fieldClass(errors.email)}
          />
          {errors.email ? (
            <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
              {errors.email}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium text-wood/70">
          Коментар
          <textarea
            rows={3}
            maxLength={1000}
            value={draft.comment}
            aria-invalid={Boolean(errors.comment)}
            onChange={(event) => onChange({ comment: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-wood/12 bg-linen px-4 py-3 outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/15"
          />
          {errors.comment ? (
            <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
              {errors.comment}
            </span>
          ) : (
            <span className="mt-2 block text-[0.72rem] font-normal normal-case tracking-normal text-wood/45">
              Необов’язково. До 1000 символів. Побачить адміністратор готелю.
            </span>
          )}
        </label>
      </div>
    </div>
  )
}


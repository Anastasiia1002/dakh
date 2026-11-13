import { useState } from 'react'
import type { GuestFieldErrors } from '../../lib/publicBooking'
import {
  authoritativeStayTotal,
  rateConditions,
  rateTypeLabel,
  roomKindLabel,
  selectEligibleRatePlan,
} from '../../lib/publicBooking'
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
import { formatDate, formatMoneyAmount } from '../../lib/format'
import { guestCountLabel, partySummary } from '../../lib/ukrainian'
import type { BookingDraft } from '../../lib/booking'
import type {
  PublicAvailabilityRatePlan,
  PublicAvailabilityRoomType,
  PublicQuoteResponse,
} from '../../lib/publicBooking/types'

function fieldClass(error?: string) {
  return [
    'mt-1 w-full border-0 border-b bg-transparent py-2 outline-none',
    error ? 'border-clay' : 'border-wood/25',
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
  return (
    <div className="mt-6">
      <p className="text-sm text-wood/70">
        Код надіслано на {email || 'вказану пошту'}. Бронювання ще не створено.
      </p>
      {editing ? (
        <div className="mt-4">
          <label className="block text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Нова пошта
            <input
              type="email"
              autoComplete="email"
              value={nextEmail}
              onChange={(event) => setNextEmail(event.target.value)}
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 normal-case tracking-normal outline-none"
            />
          </label>
          <button
            type="button"
            disabled={busy || !nextEmail.trim()}
            onClick={() => onCorrectEmail(nextEmail.trim())}
            className="mt-4 w-full border border-wood/20 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase disabled:opacity-40"
          >
            Надіслати код на цю адресу
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setNextEmail(email)
            setEditing(true)
          }}
          className="mt-3 text-sm text-clay underline-offset-4 hover:underline"
        >
          Змінити email
        </button>
      )}
      <label className="mt-6 block text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
        Код з листа
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => onCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 tracking-[0.24em] outline-none"
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
        className="mt-6 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
      >
        {busy ? 'Перевіряємо…' : 'Підтвердити код'}
      </button>
      <button
        type="button"
        disabled={busy || cooldownLeft > 0}
        onClick={onResend}
        className="mt-3 w-full border border-wood/20 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase disabled:opacity-40"
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
      <p className="mt-2 font-display text-3xl">{formatMoneyAmount(quote.totalAmount)}</p>
      <ul className="mt-4 space-y-1 text-sm text-wood/70">
        {quote.nights.map((night) => (
          <li key={night.date} className="flex justify-between gap-4">
            <span>{formatDate(night.date)}</span>
            <span>{formatMoneyAmount(night.price)}</span>
          </li>
        ))}
        {(quote.services ?? []).map((line) => (
          <li key={line.serviceId} className="flex justify-between gap-4">
            <span className="min-w-0 break-words">
              {line.name} · {line.quantity}
            </span>
            <span className="shrink-0">{formatMoneyAmount(line.totalPrice)}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={busy}
        onClick={onAccept}
        className="mt-6 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
      >
        {busy ? 'Оновлюємо…' : 'Прийняти нову ціну'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDecline}
        className="mt-3 w-full border border-wood/20 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
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
}) {
  const presentation = roomListPresentation({ searchable, status, error, place })
  if (presentation.state === 'need-dates' || presentation.state === 'loading') {
    return (
      <p className="mt-6 border border-wood/15 bg-linen px-4 py-4 text-sm text-wood/70" role="status">
        {presentation.message}
      </p>
    )
  }
  if (presentation.state === 'error') {
    return (
      <p className="mt-6 border border-clay/40 bg-beige px-4 py-4 text-sm text-clay" role="alert">
        {presentation.message}
      </p>
    )
  }
  if (presentation.state === 'empty') {
    return (
      <p className="mt-6 border border-dashed border-wood/30 bg-linen px-4 py-4 text-sm text-wood/70" role="status">
        {presentation.message}
      </p>
    )
  }

  const grouped = groupAvailabilityRooms(rooms)
  const split = grouped.rooms.length > 0 && grouped.houses.length > 0
  const sections = split
    ? [
        { key: 'rooms' as const, label: 'Кімнати', items: grouped.rooms },
        { key: 'houses' as const, label: 'Будинки', items: grouped.houses },
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
            aria-label={section.label ?? (place === 'house' ? 'Будинки' : 'Доступні помешкання')}
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
                  className={`cursor-pointer overflow-hidden ${roomOptionFrame(selected)}`}
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
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
      {emptyHouses ? (
        <p className="border border-dashed border-wood/30 bg-linen px-4 py-4 text-sm text-wood/70" role="status">
          {COTTAGE_EMPTY_COPY}
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
    return <p className="mt-6 text-sm text-wood/60">Спочатку оберіть кімнату.</p>
  }
  if (room.ratePlans.length === 0) {
    return (
      <p className="mt-6 text-sm text-wood/70">
        Для цієї кімнати на обрані дати немає доступного тарифу. Ціну не рахуємо і заявку надіслати
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
  missingRoomCopy = 'Оберіть кімнату зі списку вільних.',
  availabilityStatus,
  availabilityError = '',
  roomLabel,
  fitNote = '',
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
}) {
  const roomName = room ? publicRoomLabel(room.name, room.kind, roomLabel) : roomLabel
  const guests = partySummary(adults, kids)
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
          <p className="mt-2 text-wood/60">Перевіряємо наявність цієї кімнати…</p>
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
          На ці дати немає вільних кімнат. Спробуйте інші дати або зменшіть кількість гостей.
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
            ? 'На ці дати ця кімната недоступна. Іншу кімнату не підставляємо.'
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
        <p className="mt-1 text-wood/70">{publicPlanTitle(priced)}</p>
        <p className="mt-1 text-wood/70">{rateConditions(priced.type)}</p>
        <p className="mt-2 text-wood/70">
          {formatDate(checkIn)} — {formatDate(checkOut)}
        </p>
        <p className="mt-1 text-wood/70">
          {guests} · {nights} н. · вільних {room.availableCount}
        </p>
        <p className="mt-6 font-display text-3xl">{formatMoneyAmount(total)}</p>
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
    return <p className="mt-6 text-sm text-wood/60">Оберіть дати й кімнату.</p>
  }

  return (
    <div className="mt-6 text-sm leading-relaxed">
      <p className="font-medium">{roomName}</p>
      {plan ? (
        <div className="mt-1 text-wood/70">
          <p>{publicPlanTitle(plan)}</p>
          <p className="mt-1">{rateConditions(plan.type)}</p>
        </div>
      ) : null}
      <p className="mt-2 text-wood/70">
        {formatDate(quote.checkIn)} — {formatDate(quote.checkOut)}
      </p>
      <p className="mt-1 text-wood/70">
        {guests} · {quote.nights.length} н.
      </p>
      <ul className="mt-4 space-y-1 text-wood/70">
        {quote.nights.map((night) => (
          <li key={night.date} className="flex justify-between gap-4">
            <span>{formatDate(night.date)}</span>
            <span>{formatMoneyAmount(night.price)}</span>
          </li>
        ))}
        {(quote.services ?? []).map((line) => (
          <li key={line.serviceId} className="flex justify-between gap-4">
            <span className="min-w-0 break-words">
              {line.name} · {line.quantity}
            </span>
            <span className="shrink-0">{formatMoneyAmount(line.totalPrice)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 font-display text-3xl">{formatMoneyAmount(quote.totalAmount)}</p>
      <p className="mt-2 text-[0.72rem] text-wood/55">Сума з сервера, {quote.currency}. Це ще не підтверджене бронювання.</p>
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
        <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
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
        <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
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
        <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
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
        <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
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
        <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
          Коментар
          <textarea
            rows={3}
            maxLength={1000}
            value={draft.comment}
            aria-invalid={Boolean(errors.comment)}
            onChange={(event) => onChange({ comment: event.target.value })}
            className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
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


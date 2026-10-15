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
import { formatDate, formatMoneyAmount } from '../../lib/format'
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
  onSelect,
  roomLabel,
}: {
  rooms: PublicAvailabilityRoomType[]
  selectedId: string
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error'
  error: string
  searchable: boolean
  onSelect: (room: PublicAvailabilityRoomType) => void
  roomLabel?: (room: PublicAvailabilityRoomType) => string
}) {
  if (!searchable) {
    return <p className="mt-6 text-sm text-wood/60">Оберіть дати, щоб побачити вільні кімнати.</p>
  }
  if (status === 'loading') {
    return <p className="mt-6 text-sm text-wood/60">Шукаємо вільні кімнати…</p>
  }
  if (status === 'error') {
    return (
      <p className="mt-6 text-sm text-clay" role="alert">
        {error}
      </p>
    )
  }
  if (status === 'empty') {
    return (
      <p className="mt-6 text-sm text-wood/70">
        На ці дати немає вільних кімнат. Спробуйте інші дати або зменшіть кількість гостей.
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {rooms.map((room) => (
        <label
          key={room.roomTypeId}
          className={`grid cursor-pointer grid-cols-[96px_1fr] items-center gap-4 border p-3 ${
            selectedId === room.roomTypeId ? 'border-clay' : 'border-wood/15'
          }`}
        >
          <input
            type="radio"
            name="roomType"
            value={room.roomTypeId}
            checked={selectedId === room.roomTypeId}
            onChange={() => onSelect(room)}
            className="sr-only"
          />
          <span className="flex h-20 w-24 items-end bg-beige px-2 py-2 text-[0.62rem] font-medium tracking-[0.12em] uppercase text-wood/55">
            {roomKindLabel(room.kind)}
          </span>
          <span>
            <span className="block font-medium">{roomLabel?.(room) ?? publicRoomLabel(room.name, room.kind)}</span>
            <span className="text-sm text-wood/60">
              до {room.maxGuests} {room.maxGuests === 1 ? 'гостя' : 'гостей'} · вільних{' '}
              {room.availableCount}
              {room.availableCount > 0 &&
              room.nightlyStartingPrice &&
              room.ratePlans.some((plan) => authoritativeStayTotal(plan))
                ? ` · від ${formatMoneyAmount(room.nightlyStartingPrice)} / доба${
                    isBookingEnabled() ? '' : ', тестова ціна'
                  }`
                : ''}
            </span>
          </span>
        </label>
      ))}
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
            {authoritativeStayTotal(plan)
              ? ` · ${isBookingEnabled() ? 'попередньо' : 'тестова ціна'} ${formatMoneyAmount(plan.totalAmount)}`
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
}) {
  const roomName = room ? publicRoomLabel(room.name, room.kind, roomLabel) : roomLabel
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
          {formatDate(checkIn)} — {formatDate(checkOut)} · {nights} н. · {guestCount}{' '}
          {guestCount === 1 ? 'гість' : 'гостей'}
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
            {formatDate(checkIn)} — {formatDate(checkOut)} · {nights} н. · {guestCount}{' '}
            {guestCount === 1 ? 'гість' : 'гостей'}
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
          {adults} дорослих
          {kids ? `, ${kids} дітей` : ''} · {nights} н. · вільних {room.availableCount}
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
        {adults} дорослих
        {kids ? `, ${kids} дітей` : ''} · {quote.nights.length} н.
      </p>
      <ul className="mt-4 space-y-1 text-wood/70">
        {quote.nights.map((night) => (
          <li key={night.date} className="flex justify-between gap-4">
            <span>{formatDate(night.date)}</span>
            <span>{formatMoneyAmount(night.price)}</span>
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


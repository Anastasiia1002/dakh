import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../components/BookingCalendar'
import { emptyDraft, type BookingDraft } from '../lib/booking'
import { emailError } from '../lib/email'
import { formatDate, formatMoneyAmount } from '../lib/format'
import { formatUaMobile, uaMobileError } from '../lib/phone'
import {
  guestCountOf,
  rateTypeLabel,
  roomKindLabel,
  soleRatePlanId,
  stayNights,
  useStaySearch,
} from '../lib/publicBooking'
import type { PublicAvailabilityRatePlan, PublicAvailabilityRoomType } from '../lib/publicBooking/types'

type GuestErrors = { name?: string; phone?: string; email?: string }

function guestErrors(draft: BookingDraft): GuestErrors {
  const errors: GuestErrors = {}
  const name = draft.name.trim()
  if (!name) errors.name = 'Вкажіть ім’я.'
  else if (name.length < 2) errors.name = 'Ім’я має мати щонайменше дві літери.'
  else if (!/\p{L}/u.test(name)) errors.name = 'Ім’я має містити літери.'
  const phone = uaMobileError(draft.phone)
  if (phone) errors.phone = phone
  const mail = emailError(draft.email)
  if (mail) errors.email = mail
  return errors
}

function fieldClass(error?: string) {
  return [
    'mt-1 w-full border-0 border-b bg-transparent py-2 outline-none',
    error ? 'border-clay' : 'border-wood/25',
  ].join(' ')
}

function draftFromParams(params: URLSearchParams): BookingDraft {
  const from = params.get('from') || ''
  const to = params.get('to') && from && params.get('to')! > from ? params.get('to')! : ''
  return {
    ...emptyDraft,
    checkIn: from,
    checkOut: to,
    adults: Math.max(1, Number(params.get('adults') || 2)),
    children: Math.max(0, Number(params.get('children') || 0)),
  }
}

export function BookingPage() {
  const [params] = useSearchParams()
  const [draft, setDraft] = useState<BookingDraft>(() => draftFromParams(params))
  const [guestErr, setGuestErr] = useState<GuestErrors>({})
  const guestCount = guestCountOf(draft.adults, draft.children)
  const nights = stayNights(draft.checkIn, draft.checkOut)
  const search = useStaySearch(
    draft.checkIn,
    draft.checkOut,
    guestCount,
    draft.roomTypeId,
    draft.ratePlanId,
  )

  function patch(next: Partial<BookingDraft>) {
    setDraft((current) => {
      const merged = { ...current, ...next }
      const stayChanged =
        next.checkIn !== undefined ||
        next.checkOut !== undefined ||
        next.adults !== undefined ||
        next.children !== undefined
      if (stayChanged) {
        if (next.roomTypeId === undefined) merged.roomTypeId = ''
        if (next.ratePlanId === undefined) merged.ratePlanId = ''
      } else if (next.roomTypeId !== undefined && next.ratePlanId === undefined) {
        merged.ratePlanId = ''
      }
      return merged
    })
    setGuestErr((current) => {
      if (!current.name && !current.phone && !current.email) return current
      return guestErrors({ ...draft, ...next })
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-clay">«Забронюйте свій спокій»</h1>
      <p className="mt-5 max-w-xl text-sm text-wood/70">
        Оберіть дати й кількість гостей — вільні кімнати й ціну покаже сервер. Стіл у ресторані —
        телефоном.
      </p>

      <p className="mt-10 text-sm text-wood/60">
        {search.searchable
          ? 'Наявність і ціна — з актуального інвентаря готелю, не з демонстраційного каталогу.'
          : 'Спочатку оберіть заїзд і виїзд. Максимум 30 ночей.'}
      </p>

      <div className="mt-4">
        <BookingCalendar
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          adults={draft.adults}
          kids={draft.children}
          nightPrices={search.nightPrices}
          loading={search.availabilityStatus === 'loading' || search.quoteStatus === 'loading'}
          onChange={patch}
        />
      </div>

      <form noValidate onSubmit={submit} className="mt-12 grid gap-12 md:grid-cols-12">
        <div className="space-y-12 md:col-span-7">
          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Обрати кімнату</legend>
            <RoomOptions
              rooms={search.availability?.roomTypes ?? []}
              selectedId={draft.roomTypeId}
              status={search.availabilityStatus}
              error={search.availabilityError}
              searchable={search.searchable}
              onSelect={(room) =>
                patch({
                  roomTypeId: room.roomTypeId,
                  ratePlanId: soleRatePlanId(room),
                })
              }
            />
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Обрати тариф</legend>
            <RatePlanOptions
              room={search.selectedRoom}
              selectedId={draft.ratePlanId}
              availabilityStatus={search.availabilityStatus}
              onSelect={(ratePlanId) => patch({ ratePlanId })}
            />
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Деталі гостя</legend>
            <p className="mt-2 text-sm text-wood/70">
              Ім’я, телефон і пошта знадобляться на наступному кроці. Заявку зараз надіслати не
              можна.
            </p>
            <div className="mt-6 grid gap-6">
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Ім’я *
                <input
                  autoComplete="name"
                  value={draft.name}
                  aria-invalid={Boolean(guestErr.name)}
                  onChange={(event) => patch({ name: event.target.value })}
                  className={fieldClass(guestErr.name)}
                />
                {guestErr.name ? (
                  <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
                    {guestErr.name}
                  </span>
                ) : null}
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Телефон *
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+38 (095) 818-00-01"
                  value={draft.phone}
                  aria-invalid={Boolean(guestErr.phone)}
                  onChange={(event) => patch({ phone: event.target.value })}
                  onBlur={() => {
                    const formatted = formatUaMobile(draft.phone)
                    if (formatted) patch({ phone: formatted })
                    else setGuestErr((current) => ({ ...current, phone: uaMobileError(draft.phone) }))
                  }}
                  className={fieldClass(guestErr.phone)}
                />
                {guestErr.phone ? (
                  <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
                    {guestErr.phone}
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
                  aria-invalid={Boolean(guestErr.email)}
                  onChange={(event) => patch({ email: event.target.value })}
                  onBlur={() => {
                    const trimmed = draft.email.trim()
                    if (trimmed !== draft.email) patch({ email: trimmed })
                    setGuestErr((current) => ({ ...current, email: emailError(trimmed) }))
                  }}
                  className={fieldClass(guestErr.email)}
                />
                {guestErr.email ? (
                  <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
                    {guestErr.email}
                  </span>
                ) : null}
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Коментар
                <textarea
                  rows={3}
                  value={draft.comment}
                  onChange={(event) => patch({ comment: event.target.value })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
            </div>
          </fieldset>
        </div>

        <aside className="h-fit bg-beige p-6 md:sticky md:top-8 md:col-span-5">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase">Ваше бронювання</p>
          <QuoteSummary
            checkIn={draft.checkIn}
            checkOut={draft.checkOut}
            nights={nights}
            guestCount={guestCount}
            adults={draft.adults}
            kids={draft.children}
            room={search.selectedRoom}
            plan={search.selectedPlan}
            quote={search.quote}
            quoteStatus={search.quoteStatus}
            quoteError={search.quoteError}
          />
          <button
            type="submit"
            disabled
            className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
          >
            Надіслати заявку
          </button>
          <p className="mt-4 text-[0.72rem] text-wood/55">
            Підтвердження бронювання з’явиться після перевірки пошти. Цей крок ще не підключено —
            заявку в браузері не зберігаємо і бронювання не створюємо.
          </p>
        </aside>
      </form>
    </section>
  )
}

function RoomOptions({
  rooms,
  selectedId,
  status,
  error,
  searchable,
  onSelect,
}: {
  rooms: PublicAvailabilityRoomType[]
  selectedId: string
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error'
  error: string
  searchable: boolean
  onSelect: (room: PublicAvailabilityRoomType) => void
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
            <span className="block font-medium">{room.name}</span>
            <span className="text-sm text-wood/60">
              до {room.maxGuests} {room.maxGuests === 1 ? 'гостя' : 'гостей'} · вільних{' '}
              {room.availableCount}
              {room.nightlyStartingPrice
                ? ` · від ${formatMoneyAmount(room.nightlyStartingPrice)} / доба`
                : ''}
            </span>
          </span>
        </label>
      ))}
    </div>
  )
}

function RatePlanOptions({
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
          <span className="block font-medium">{plan.name}</span>
          <span className="mt-1 block text-sm text-wood/60">
            {rateTypeLabel(plan.type)} · попередньо {formatMoneyAmount(plan.totalAmount)}
          </span>
        </label>
      ))}
      <p className="text-[0.72rem] text-wood/50">
        Попередня сума з наявності. Підсумкову ціну покаже сервер після розрахунку.
      </p>
    </div>
  )
}

function QuoteSummary({
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
}: {
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  adults: number
  kids: number
  room?: PublicAvailabilityRoomType
  plan?: PublicAvailabilityRatePlan
  quote: ReturnType<typeof useStaySearch>['quote']
  quoteStatus: ReturnType<typeof useStaySearch>['quoteStatus']
  quoteError: string
}) {
  if (!checkIn || !checkOut || nights < 1) {
    return <p className="mt-6 text-sm text-wood/60">Оберіть дати й кімнату.</p>
  }
  if (!room) {
    return <p className="mt-6 text-sm text-wood/60">Оберіть кімнату зі списку вільних.</p>
  }
  if (room.ratePlans.length === 0) {
    return (
      <div className="mt-6 text-sm leading-relaxed text-wood/70">
        <p className="font-medium">{room.name}</p>
        <p className="mt-2">
          {formatDate(checkIn)} — {formatDate(checkOut)} · {nights} н. · {guestCount}{' '}
          {guestCount === 1 ? 'гість' : 'гостей'}
        </p>
        <p className="mt-4">
          На ці дати немає доступного тарифу. Ціну не вигадуємо і бронювання не створюємо.
        </p>
      </div>
    )
  }
  if (!plan) {
    return (
      <div className="mt-6 text-sm leading-relaxed text-wood/70">
        <p className="font-medium">{room.name}</p>
        <p className="mt-4">Оберіть тариф, щоб сервер порахував точну суму.</p>
      </div>
    )
  }
  if (quoteStatus === 'loading') {
    return <p className="mt-6 text-sm text-wood/60">Рахуємо вартість…</p>
  }
  if (quoteStatus === 'error') {
    return (
      <p className="mt-6 text-sm text-clay" role="alert">
        {quoteError}
      </p>
    )
  }
  if (!quote) {
    return <p className="mt-6 text-sm text-wood/60">Оберіть дати, кімнату й тариф.</p>
  }

  return (
    <div className="mt-6 text-sm leading-relaxed">
      <p className="font-medium">{room.name}</p>
      <p className="mt-1 text-wood/70">
        {plan.name} · {rateTypeLabel(plan.type)}
      </p>
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
      <p className="mt-2 text-[0.72rem] text-wood/55">
        Це розрахунок сервера, не попередня сума тарифу і не підтверджене бронювання. Сума в{' '}
        {quote.currency}.
      </p>
    </div>
  )
}

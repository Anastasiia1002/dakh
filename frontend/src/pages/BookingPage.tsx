import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { stayBySlug, stays } from '../data/catalog'
import {
  emptyDraft,
  loadBookings,
  makeBookingId,
  quoteStay,
  saveBooking,
  stayAvailable,
  stayFitsGuests,
  type BookingDraft,
  type StoredBooking,
} from '../lib/booking'
import { addDays, formatDate, formatMoney, nightsBetween, todayIso } from '../lib/format'

function draftFromParams(params: URLSearchParams): BookingDraft {
  const from = params.get('from') || todayIso()
  const minOut = addDays(from, 1)
  const to = params.get('to') && params.get('to')! > from ? params.get('to')! : minOut
  return {
    ...emptyDraft,
    checkIn: from,
    checkOut: to,
    adults: Math.max(1, Number(params.get('adults') || 2)),
    children: Math.max(0, Number(params.get('children') || 0)),
    staySlug: params.get('stay') || '',
  }
}

export function BookingPage() {
  const [params] = useSearchParams()
  const [draft, setDraft] = useState<BookingDraft>(() => draftFromParams(params))
  const [confirmed, setConfirmed] = useState<StoredBooking | null>(null)
  const [error, setError] = useState('')
  const previous = loadBookings()

  const nights = nightsBetween(draft.checkIn, draft.checkOut)
  const selected = stayBySlug(draft.staySlug)
  const quote = selected && nights > 0 ? quoteStay(selected, draft.checkIn, draft.checkOut) : null

  const options = useMemo(
    () =>
      stays.map((stay) => ({
        stay,
        ok:
          nights > 0 &&
          stayFitsGuests(stay, draft.adults, draft.children) &&
          stayAvailable(stay, draft.checkIn, draft.checkOut),
      })),
    [draft.adults, draft.children, draft.checkIn, draft.checkOut, nights],
  )

  function patch(next: Partial<BookingDraft>) {
    setDraft((current) => ({ ...current, ...next }))
    setError('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected || !quote || quote.nights < 1) {
      setError('Оберіть кімнату й дати.')
      return
    }
    if (!stayAvailable(selected, draft.checkIn, draft.checkOut)) {
      setError('На ці дати кімната зайнята.')
      return
    }
    if (!stayFitsGuests(selected, draft.adults, draft.children)) {
      setError('Забагато гостей для цієї кімнати.')
      return
    }
    const booking: StoredBooking = {
      ...draft,
      id: makeBookingId(),
      nights: quote.nights,
      total: quote.total,
      stayName: selected.name,
      createdAt: new Date().toISOString(),
    }
    saveBooking(booking)
    setConfirmed(booking)
  }

  if (confirmed) {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">Заявку збережено</p>
        <h1 className="mt-3 font-display text-5xl leading-tight">Чекаємо вас під дахом.</h1>
        <p className="mt-6 text-sm text-wood/70">
          Номер <strong>{confirmed.id}</strong> лежить у localStorage ключа{' '}
          <code>dakh-bookings</code>.
        </p>
        <dl className="mt-10 grid gap-6 bg-beige p-8 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/55">Кімната</dt>
            <dd className="mt-1">{confirmed.stayName}</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/55">Дати</dt>
            <dd className="mt-1">
              {formatDate(confirmed.checkIn)} — {formatDate(confirmed.checkOut)} · {confirmed.nights}{' '}
              н.
            </dd>
          </div>
          <div>
            <dt className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/55">Сума</dt>
            <dd className="mt-1">{formatMoney(confirmed.total)}</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/55">Гість</dt>
            <dd className="mt-1">
              {confirmed.name}
              <br />
              {confirmed.phone}
            </dd>
          </div>
        </dl>
        <Link
          to="/"
          className="mt-10 inline-flex bg-clay px-8 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen"
        >
          На головну
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">Sunny Park</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-clay">«Забронюйте свій спокій»</h1>
      <p className="mt-5 max-w-xl text-sm text-wood/70">
        Тільки кімнати. Стіл у ресторані — телефоном. Заявки пишуться в localStorage, без
        оплати.
      </p>

      <form onSubmit={submit} className="mt-14 grid gap-12 md:grid-cols-12">
        <div className="space-y-12 md:col-span-7">
          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Параметри бронювання</legend>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Заїзд
                <input
                  type="date"
                  value={draft.checkIn}
                  min={todayIso()}
                  required
                  onChange={(event) => {
                    const checkIn = event.target.value
                    patch({
                      checkIn,
                      checkOut: draft.checkOut <= checkIn ? addDays(checkIn, 1) : draft.checkOut,
                    })
                  }}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Виїзд
                <input
                  type="date"
                  value={draft.checkOut}
                  min={addDays(draft.checkIn, 1)}
                  required
                  onChange={(event) => patch({ checkOut: event.target.value })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Дорослі
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={draft.adults}
                  onChange={(event) => patch({ adults: Number(event.target.value) })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Діти
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={draft.children}
                  onChange={(event) => patch({ children: Number(event.target.value) })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Обрати кімнату</legend>
            <div className="mt-6 space-y-4">
              {options.map(({ stay, ok }) => (
                <label
                  key={stay.slug}
                  className={`grid cursor-pointer grid-cols-[96px_1fr_auto] items-center gap-4 border p-3 ${
                    draft.staySlug === stay.slug ? 'border-clay' : 'border-wood/15'
                  } ${ok ? '' : 'opacity-40'}`}
                >
                  <input
                    type="radio"
                    name="stay"
                    value={stay.slug}
                    disabled={!ok}
                    checked={draft.staySlug === stay.slug}
                    onChange={() => patch({ staySlug: stay.slug })}
                    className="sr-only"
                  />
                  <Photo src={stay.images[0]} alt="" className="h-20 w-24" />
                  <span>
                    <span className="block font-medium">{stay.name}</span>
                    <span className="text-sm text-wood/60">
                      {formatMoney(stay.priceFrom)} / доба
                      {!ok ? ' · зайнято або не підходить' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="font-display text-3xl">Деталі гостя</legend>
            <div className="mt-6 grid gap-6">
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Ім’я
                <input
                  required
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Телефон
                <input
                  type="tel"
                  required
                  value={draft.phone}
                  onChange={(event) => patch({ phone: event.target.value })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
              </label>
              <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
                Email
                <input
                  type="email"
                  required
                  value={draft.email}
                  onChange={(event) => patch({ email: event.target.value })}
                  className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
                />
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
          {selected && quote && quote.nights > 0 ? (
            <div className="mt-6 text-sm leading-relaxed">
              <p className="font-medium">{selected.name}</p>
              <p className="mt-2 text-wood/70">
                {formatDate(draft.checkIn)} — {formatDate(draft.checkOut)}
              </p>
              <p className="mt-1 text-wood/70">
                {draft.adults} дорослих
                {draft.children ? `, ${draft.children} дітей` : ''} · {quote.nights} н.
              </p>
              <p className="mt-6 font-display text-3xl">{formatMoney(quote.total)}</p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-wood/60">Оберіть дати й кімнату.</p>
          )}
          {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
          <button
            type="submit"
            className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen"
          >
            Надіслати заявку
          </button>
          {previous.length ? (
            <p className="mt-4 text-[0.72rem] text-wood/50">
              У цьому браузері вже є {previous.length} заяв.{' '}
              <code>dakh-bookings</code>
            </p>
          ) : null}
        </aside>
      </form>
    </section>
  )
}

import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StayCard } from '../components/StayCard'
import { stayBySlug, stays } from '../data/catalog'
import {
  emptyDraft,
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

  const nights = nightsBetween(draft.checkIn, draft.checkOut)
  const matches = useMemo(
    () =>
      stays.map((stay) => ({
        stay,
        fits: stayFitsGuests(stay, draft.adults, draft.children),
        free: stayAvailable(stay, draft.checkIn, draft.checkOut),
      })),
    [draft.adults, draft.children, draft.checkIn, draft.checkOut],
  )

  const selected = stayBySlug(draft.staySlug)
  const quote = selected && nights > 0 ? quoteStay(selected, draft.checkIn, draft.checkOut) : null

  function patch(next: Partial<BookingDraft>) {
    setDraft((current) => ({ ...current, ...next }))
    setError('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected || !quote || quote.nights < 1) {
      setError('Оберіть житло й коректні дати.')
      return
    }
    if (!stayAvailable(selected, draft.checkIn, draft.checkOut)) {
      setError('На ці дати цей варіант зайнятий.')
      return
    }
    if (!stayFitsGuests(selected, draft.adults, draft.children)) {
      setError('Забагато гостей для цього житла.')
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
      <section className="page confirm">
        <p className="eyebrow">Заявку збережено</p>
        <h1>Чекаємо вас під дахом Sunny Park.</h1>
        <p className="lede">
          Номер заявки <strong>{confirmed.id}</strong>. У цьому прототипі вона
          лежить у браузері — рецепція ще не отримує лист.
        </p>
        <dl className="confirm-card">
          <div>
            <dt>Житло</dt>
            <dd>{confirmed.stayName}</dd>
          </div>
          <div>
            <dt>Дати</dt>
            <dd>
              {formatDate(confirmed.checkIn)} — {formatDate(confirmed.checkOut)} ·{' '}
              {confirmed.nights} н.
            </dd>
          </div>
          <div>
            <dt>Гості</dt>
            <dd>
              {confirmed.adults} дорослих
              {confirmed.children ? `, ${confirmed.children} дітей` : ''}
            </dd>
          </div>
          <div>
            <dt>Сума</dt>
            <dd>{formatMoney(confirmed.total)}</dd>
          </div>
          <div>
            <dt>Контакт</dt>
            <dd>
              {confirmed.name}
              <br />
              {confirmed.phone}
            </dd>
          </div>
        </dl>
        <Link className="btn btn-sun" to="/">
          На головну
        </Link>
      </section>
    )
  }

  return (
    <section className="page booking-page">
      <header className="page-hero">
        <p className="eyebrow">Крок за кроком</p>
        <h1>Бронювання</h1>
        <p className="lede">
          Дати, житло, контакти. Наявність рахується з тестового календаря —
          частина дат уже «зайнята», щоб було видно відмову.
        </p>
      </header>

      <form className="book-form" onSubmit={submit}>
        <fieldset>
          <legend>1. Дати</legend>
          <div className="form-grid">
            <label>
              Заїзд
              <input
                type="date"
                value={draft.checkIn}
                min={todayIso()}
                onChange={(event) => {
                  const checkIn = event.target.value
                  patch({
                    checkIn,
                    checkOut: draft.checkOut <= checkIn ? addDays(checkIn, 1) : draft.checkOut,
                  })
                }}
                required
              />
            </label>
            <label>
              Виїзд
              <input
                type="date"
                value={draft.checkOut}
                min={addDays(draft.checkIn, 1)}
                onChange={(event) => patch({ checkOut: event.target.value })}
                required
              />
            </label>
            <label>
              Дорослі
              <input
                type="number"
                min={1}
                max={12}
                value={draft.adults}
                onChange={(event) => patch({ adults: Number(event.target.value) })}
              />
            </label>
            <label>
              Діти
              <input
                type="number"
                min={0}
                max={8}
                value={draft.children}
                onChange={(event) => patch({ children: Number(event.target.value) })}
              />
            </label>
          </div>
          <p className="muted">
            {nights > 0
              ? `${nights} ${nights === 1 ? 'ніч' : nights < 5 ? 'ночі' : 'ночей'}`
              : 'Оберіть виїзд пізніше заїзду'}
          </p>
        </fieldset>

        <fieldset>
          <legend>2. Житло</legend>
          <div className="booking-stays">
            {matches.map(({ stay, fits, free }) => {
              const disabled = !fits || !free || nights < 1
              return (
                <label
                  key={stay.slug}
                  className={`choice ${draft.staySlug === stay.slug ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="stay"
                    value={stay.slug}
                    disabled={disabled}
                    checked={draft.staySlug === stay.slug}
                    onChange={() => patch({ staySlug: stay.slug })}
                  />
                  <StayCard
                    stay={stay}
                    available={free && fits}
                    nights={nights > 0 ? nights : undefined}
                    selectable
                  />
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend>3. Контакт</legend>
          <div className="form-grid">
            <label>
              Ім’я
              <input
                value={draft.name}
                onChange={(event) => patch({ name: event.target.value })}
                required
              />
            </label>
            <label>
              Телефон
              <input
                type="tel"
                placeholder="+38"
                value={draft.phone}
                onChange={(event) => patch({ phone: event.target.value })}
                required
              />
            </label>
            <label className="wide">
              Email
              <input
                type="email"
                value={draft.email}
                onChange={(event) => patch({ email: event.target.value })}
                required
              />
            </label>
            <label className="wide">
              Коментар
              <textarea
                rows={3}
                value={draft.comment}
                onChange={(event) => patch({ comment: event.target.value })}
              />
            </label>
          </div>
        </fieldset>

        <div className="booking-summary">
          {selected && quote && quote.nights > 0 ? (
            <p>
              {selected.name} · {quote.nights} н. ·{' '}
              <strong>{formatMoney(quote.total)}</strong>
            </p>
          ) : (
            <p>Оберіть доступне житло, щоб побачити суму.</p>
          )}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-sun" type="submit">
            Надіслати заявку
          </button>
        </div>
      </form>
    </section>
  )
}

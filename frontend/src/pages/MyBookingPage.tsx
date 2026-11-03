import { useRef, useState, type FormEvent } from 'react'
import { site } from '../data/catalog'
import { formatDate, formatMoneyAmount } from '../lib/format'
import { isHiddenInventoryLabel } from '../lib/publicBooking/display'
import { readRoomDisplayName } from '../lib/publicBooking/handoff'
import {
  accessCodeError,
  lookupFailureCopy,
  lookupGuestBooking,
  normalizeAccessCode,
  type GuestBookingView,
} from '../lib/publicBooking/myBooking'
import { guestCountLabel } from '../lib/ukrainian'
import { BOOKING_DISABLED_COPY, isBookingEnabled } from '../lib/publicBooking/config'

function accommodationName(roomTypeId: string, roomTypeName: string) {
  return (
    readRoomDisplayName(roomTypeId) ??
    (isHiddenInventoryLabel(roomTypeName) ? 'Кімната' : roomTypeName)
  )
}

export function MyBookingPage() {
  const bookingEnabled = isBookingEnabled()
  const [code, setCode] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<GuestBookingView | null>(null)
  const heldCode = useRef('')

  async function lookup(accessCode: string, source: 'submit' | 'refresh') {
    setLoading(true)
    setError('')
    try {
      const next = await lookupGuestBooking(accessCode, accommodationName, guestCountLabel)
      heldCode.current = normalizeAccessCode(accessCode)
      setCode('')
      setRevealed(false)
      setView(next)
    } catch (caught) {
      setError(lookupFailureCopy(caught))
      if (source === 'submit') {
        heldCode.current = ''
        setView(null)
      }
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!bookingEnabled || loading) return
    const problem = accessCodeError(code)
    if (problem) {
      setError(problem)
      setView(null)
      return
    }
    void lookup(code, 'submit')
  }

  function refresh() {
    if (!heldCode.current || loading) return
    void lookup(heldCode.current, 'refresh')
  }

  function lookupAnother() {
    heldCode.current = ''
    setView(null)
    setError('')
    setCode('')
    setRevealed(false)
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-clay sm:text-5xl">Моє бронювання</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-wood/70">
        Вставте код доступу з підтвердження. Він є на екрані після бронювання і в листі, у рядку «Код доступу до
        підтвердження». Номер бронювання не відкриє бронювання, навіть без дефісів. Код не зберігається в браузері, і
        кожен перегляд запитує актуальний стан на сервері.
      </p>

      {!bookingEnabled ? (
        <p className="mt-10 max-w-xl text-sm leading-relaxed text-wood/70" role="status">
          {BOOKING_DISABLED_COPY}
        </p>
      ) : (
        <form noValidate onSubmit={onSubmit} className="mt-6">
          <label
            htmlFor="booking-access-code"
            className="text-[0.62rem] tracking-[0.14em] text-wood/55 uppercase"
          >
            Код доступу
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-sm border border-wood/15 bg-beige/40 px-2.5 focus-within:border-clay/70">
            <input
              id="booking-access-code"
              name="booking-access-code"
              value={code}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              type={revealed ? 'text' : 'password'}
              disabled={loading}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'booking-access-error' : undefined}
              onChange={(event) => setCode(event.target.value)}
              className="access-code min-h-11 min-w-0 flex-1 overflow-x-auto border-0 bg-transparent py-2 text-[13px] leading-5 outline-none"
            />
            <button
              type="button"
              className="shrink-0 text-[0.68rem] tracking-[0.08em] text-wood/70 uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              aria-pressed={revealed}
              onClick={() => setRevealed((value) => !value)}
            >
              {revealed ? 'Сховати' : 'Показати'}
            </button>
          </div>
          {error ? (
            <p id="booking-access-error" className="mt-2 max-w-xl text-[13px] leading-snug text-clay" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 min-h-11 bg-clay px-6 py-3 text-[0.78rem] font-semibold tracking-[0.14em] uppercase text-linen disabled:opacity-40"
          >
            {loading ? 'Шукаємо…' : 'Показати бронювання'}
          </button>
        </form>
      )}

      {view ? (
        <div className="mt-10 min-w-0 bg-beige p-4 sm:p-6" role="status">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase">{view.statusLabel}</p>
          {view.cancelled ? (
            <p className="mt-3 text-sm text-clay">Це бронювання скасоване. Дати й сума нижче — останні дані з сервера.</p>
          ) : null}
          <p className="mt-4 break-words font-display text-3xl leading-tight sm:text-4xl">
            {view.accommodation}
            {view.roomNumber ? ` · № ${view.roomNumber}` : ''}
          </p>
          <p className="mt-4 text-sm text-wood/70">
            {formatDate(view.checkIn)} — {formatDate(view.checkOut)}
            {view.nights ? ` · ${view.nights} н.` : ''} · {view.guests}
          </p>
          {view.services.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-wood/70">
              {view.services.map((line) => (
                <li key={line.serviceId} className="flex justify-between gap-4">
                  <span className="min-w-0 break-words">
                    {line.name} · {line.quantity}
                  </span>
                  <span className="shrink-0">{formatMoneyAmount(line.totalPrice)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-6 break-all text-sm">
            Номер бронювання: <span className="font-medium">{view.reference}</span>
          </p>
          <p className="mt-6 font-display text-3xl">{formatMoneyAmount(view.totalAmount)}</p>
          {view.paymentLabel ? <p className="mt-2 text-sm text-wood/70">{view.paymentLabel}</p> : null}
          <p className="mt-2 text-[0.72rem] text-wood/55">
            Сума в {view.currency}. Дати, гості, послуги й сума щойно отримані з сервера. Оплату на сайті не стягнуто.
          </p>
          <div className="mt-6 text-sm text-wood/70">
            <p>{site.hotel}</p>
            <p className="mt-1">{site.address}</p>
            <p className="mt-1">
              <a href={site.phoneHrefs[0]}>{site.phones[0]}</a>
              {site.phones[1] ? (
                <>
                  {' · '}
                  <a href={site.phoneHrefs[1]}>{site.phones[1]}</a>
                </>
              ) : null}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={loading}
              onClick={refresh}
              className="min-h-11 border border-wood/20 px-5 py-3 text-[0.72rem] tracking-[0.12em] uppercase disabled:opacity-40"
            >
              Оновити
            </button>
            <button
              type="button"
              onClick={lookupAnother}
              className="min-h-11 px-5 py-3 text-left text-[0.72rem] tracking-[0.12em] uppercase text-wood/70"
            >
              Інший код
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

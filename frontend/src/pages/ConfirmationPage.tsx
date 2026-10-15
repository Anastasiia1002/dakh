import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate, formatMoneyAmount } from '../lib/format'
import { publicBookingClient, recoverEmailError } from '../lib/publicBooking'
import { BOOKING_DISABLED_COPY, isBookingEnabled } from '../lib/publicBooking/config'
import { isHiddenInventoryLabel } from '../lib/publicBooking/display'
import { readRoomDisplayName } from '../lib/publicBooking/handoff'
import { errorCopy, isAbortError } from '../lib/publicBooking/errors'
import {
  isConfirmationToken,
  readStoredConfirmationToken,
  readStoredIntent,
} from '../lib/publicBooking/checkout'
import type { PublicBookingConfirmationResponse } from '../lib/publicBooking/types'

export function ConfirmationPage() {
  const { token: routeToken = '' } = useParams()
  const token = decodeURIComponent(routeToken) || readStoredConfirmationToken()
  const validToken = isConfirmationToken(token) ? token : ''
  const storedIntent = readStoredIntent()
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmationResponse | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [resolved, setResolved] = useState(!validToken)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverHint, setRecoverHint] = useState('')
  const [recoverBusy, setRecoverBusy] = useState(false)
  const error = validToken
    ? lookupError
    : token
      ? 'Посилання на підтвердження недійсне.'
      : 'Підтвердження не знайдено. Успіх не показуємо з локальних даних.'
  const bookingEnabled = isBookingEnabled()
  const loading = bookingEnabled && Boolean(validToken) && !resolved

  useEffect(() => {
    if (!bookingEnabled || !validToken) return
    let cancelled = false
    publicBookingClient
      .confirmation(validToken)
      .then((result) => {
        if (cancelled) return
        setConfirmation(result)
        setLookupError('')
        setResolved(true)
      })
      .catch((caught: unknown) => {
        if (cancelled || isAbortError(caught)) return
        setConfirmation(null)
        setLookupError(errorCopy(caught))
        setResolved(true)
      })
    return () => {
      cancelled = true
    }
  }, [bookingEnabled, validToken])

  async function recover(event: FormEvent) {
    event.preventDefault()
    if (!isBookingEnabled()) return
    const mailError = recoverEmailError(recoverEmail)
    if (mailError) {
      setRecoverHint(mailError)
      return
    }
    if (!storedIntent?.intentId) {
      setRecoverHint('Немає заявки, з якої можна відновити лист. Почніть бронювання знову.')
      return
    }
    setRecoverBusy(true)
    setRecoverHint('')
    try {
      await publicBookingClient.recoverConfirmation(storedIntent.intentId, { email: recoverEmail.trim() })
      setRecoverHint('Якщо пошта збігається з заявкою, перевірте скриньку.')
    } catch (caught) {
      setRecoverHint(errorCopy(caught))
    } finally {
      setRecoverBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-clay">Підтвердження</h1>

      {!bookingEnabled ? (
        <p className="mt-10 max-w-xl text-sm leading-relaxed text-wood/70" role="status">
          {BOOKING_DISABLED_COPY}
        </p>
      ) : null}

      {bookingEnabled && loading ? <p className="mt-10 text-sm text-wood/60">Шукаємо підтвердження на сервері…</p> : null}

      {bookingEnabled && !loading && confirmation ? (
        <div className="mt-10 bg-beige p-6">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase">Підтверджено</p>
          <p className="mt-4 font-display text-4xl">
            {readRoomDisplayName(confirmation.roomTypeId) ??
              (isHiddenInventoryLabel(confirmation.roomTypeName) ? 'Кімната' : confirmation.roomTypeName)}
          </p>
          <p className="mt-4 text-sm text-wood/70">
            {formatDate(confirmation.checkIn)} — {formatDate(confirmation.checkOut)} · {confirmation.guestCount}{' '}
            {confirmation.guestCount === 1 ? 'гість' : 'гостей'}
          </p>
          <p className="mt-6 text-sm">
            Номер бронювання:{' '}
            <span className="font-medium">{confirmation.bookingReference}</span>
          </p>
          <p className="mt-6 font-display text-3xl">{formatMoneyAmount(confirmation.totalAmount)}</p>
          <p className="mt-2 text-[0.72rem] text-wood/55">Сума в {confirmation.currency}. Дані з сервера.</p>
        </div>
      ) : null}

      {bookingEnabled && !loading && !confirmation ? (
        <div className="mt-10">
          <p className="text-sm text-clay" role="alert">
            {error || 'Підтвердження не знайдено. Успіх не показуємо з локальних даних.'}
          </p>
          <form noValidate onSubmit={recover} className="mt-8">
            <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
              Пошта для відновлення
              <input
                type="email"
                autoComplete="email"
                value={recoverEmail}
                onChange={(event) => setRecoverEmail(event.target.value)}
                className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
              />
            </label>
            {recoverHint ? (
              <p className="mt-3 text-sm text-wood/70" role="status">
                {recoverHint}
              </p>
            ) : (
              <p className="mt-3 text-sm text-wood/55">
                Якщо пошта збігається, сервер надішле доступ. Відповідь не підтверджує, що адреса
                існує.
              </p>
            )}
            <button
              type="submit"
              disabled={recoverBusy}
              className="mt-6 bg-clay px-6 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
            >
              {recoverBusy ? 'Надсилаємо…' : 'Надіслати доступ'}
            </button>
          </form>
        </div>
      ) : null}

      <Link
        to="/bronuvannya"
        className="mt-10 inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
      >
        До бронювання
      </Link>
    </section>
  )
}

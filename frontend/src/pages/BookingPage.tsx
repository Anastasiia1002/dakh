import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { BOOKING_DISABLED_COPY } from '../lib/publicBooking/config'

const ActiveBooking =
  import.meta.env?.VITE_BOOKING_ENABLED === 'true'
    ? lazy(() => import('./BookingFlow').then((module) => ({ default: module.BookingFlow })))
    : null

export function BookingPage() {
  if (!ActiveBooking) {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-clay">Бронювання</h1>
        <p className="mt-10 max-w-xl text-sm leading-relaxed text-wood/70" role="status">
          {BOOKING_DISABLED_COPY}
        </p>
        <Link
          to="/rooms"
          className="mt-10 inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          До кімнат
        </Link>
      </section>
    )
  }

  return (
    <Suspense fallback={<p className="px-6 pt-32 text-sm text-wood/60">Завантажуємо бронювання…</p>}>
      <ActiveBooking />
    </Suspense>
  )
}

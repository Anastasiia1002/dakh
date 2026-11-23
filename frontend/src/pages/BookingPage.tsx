import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { PAGE_SHELL } from '../lib/layout'
import { BOOKING_DISABLED_COPY } from '../lib/publicBooking/config'

const ActiveBooking =
  import.meta.env?.VITE_BOOKING_ENABLED === 'true'
    ? lazy(() => import('./BookingFlow').then((module) => ({ default: module.BookingFlow })))
    : null

export function BookingPage() {
  return (
    <div className={`bg-linen pb-28 pt-8 md:pb-16 md:pt-10 ${PAGE_SHELL}`}>
      {ActiveBooking ? (
        <Suspense fallback={<p className="py-16 text-sm text-wood/60">Завантажуємо бронювання…</p>}>
          <ActiveBooking />
        </Suspense>
      ) : (
        <section className="max-w-3xl py-8">
          <p className="kicker text-[0.68rem] text-clay">Готель DAKH</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-clay">Бронювання</h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-wood/70" role="status">
            {BOOKING_DISABLED_COPY}
          </p>
          <Link
            to="/rooms"
            className="mt-10 inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
          >
            До номерів
          </Link>
        </section>
      )}
    </div>
  )
}

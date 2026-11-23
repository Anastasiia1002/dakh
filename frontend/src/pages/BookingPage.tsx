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
    <div className={`bg-linen pb-28 pt-6 md:pb-16 md:pt-8 ${PAGE_SHELL}`}>
      {ActiveBooking ? (
        <Suspense fallback={<p className="py-16 text-sm text-wood/60">Завантажуємо бронювання…</p>}>
          <ActiveBooking />
        </Suspense>
      ) : (
        <section className="max-w-xl py-8">
          <p className="text-sm font-medium tracking-[0.14em] uppercase text-clay/90">Готель DAKH</p>
          <h1 className="mt-1 font-display text-[2.35rem] leading-[1.08] text-clay">Бронювання</h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-wood/70" role="status">
            {BOOKING_DISABLED_COPY}
          </p>
          <Link
            to="/rooms"
            className="mt-10 inline-flex min-h-12 items-center rounded-full border border-wood/15 px-6 text-[0.95rem] font-medium text-wood"
          >
            До номерів
          </Link>
        </section>
      )}
    </div>
  )
}

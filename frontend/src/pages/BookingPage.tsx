import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { images } from '../data/catalog'
import { PAGE_SHELL } from '../lib/layout'
import { BOOKING_DISABLED_COPY } from '../lib/publicBooking/config'

const ActiveBooking =
  import.meta.env?.VITE_BOOKING_ENABLED === 'true'
    ? lazy(() => import('./BookingFlow').then((module) => ({ default: module.BookingFlow })))
    : null

export function BookingPage() {
  return (
    <>
      <section className="photo-grain relative min-h-[28svh] md:min-h-[34vh]">
        <Photo
          src={images.pottery}
          alt="Вітальня DAKH із видом на гори"
          tone={false}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-wood/40" />
        <div
          className={`relative flex min-h-[28svh] min-w-0 flex-col justify-end pb-10 pt-24 md:min-h-[34vh] md:pb-12 ${PAGE_SHELL}`}
        >
          <p className="kicker text-[0.68rem] text-linen/80">Готель DAKH</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[1.08] text-linen sm:text-5xl md:text-6xl">
            Бронювання
          </h1>
          <p className="mt-3 max-w-md text-sm text-linen/90">
            Дати й гості спочатку. Потім помешкання. Суму підтверджує сервер.
          </p>
        </div>
      </section>

      {ActiveBooking ? (
        <div className={`relative z-10 pb-40 md:pb-24 ${PAGE_SHELL}`}>
          <Suspense fallback={<p className="px-2 py-16 text-sm text-wood/60">Завантажуємо бронювання…</p>}>
            <ActiveBooking hideIntro />
          </Suspense>
        </div>
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <p className="max-w-xl text-sm leading-relaxed text-wood/70" role="status">
            {BOOKING_DISABLED_COPY}
          </p>
          <Link
            to="/rooms"
            className="mt-10 inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
          >
            До кімнат
          </Link>
        </section>
      )}
    </>
  )
}

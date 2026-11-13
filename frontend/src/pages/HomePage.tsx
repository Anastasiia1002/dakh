import { Link } from 'react-router-dom'
import { Spot } from '../components/BrandMarks'
import { CatalogState } from '../components/CatalogState'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { categoryBase, categoryLabel, type AccommodationCategory } from '../lib/catalog/categories'
import { useAccommodationList } from '../lib/catalog/useAccommodations'
import { images, site } from '../data/catalog'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

export function HomePage() {
  return (
    <>
      <section className="photo-grain relative min-h-[92vh]">
        <Photo
          src={images.heroHouse}
          alt="Фасад DAKH увечері в Мигові"
          tone={false}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-wood/30" />
        <div className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pt-24 text-center">
          <p className="kicker text-[0.68rem] text-linen/80">DAKH · Мигове</p>
          <h1 className="-rotate-1 font-display text-5xl leading-[1.05] text-linen md:text-7xl">
            «Вище даху тільки небо»
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-linen/90">
            Кімнати в будинку й окремі будинки. Ресторан унизу. Дати обираєте ви, суму підтверджує сервер.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {bookingEnabled ? (
              <Link
                to="/bronuvannya"
                className="inline-flex min-h-11 items-center bg-clay px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-linen"
              >
                Забронювати
              </Link>
            ) : null}
            <Link
              to="/rooms"
              className="inline-flex min-h-11 items-center border border-linen/70 px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-linen"
            >
              Кімнати
            </Link>
            <Link
              to="/houses"
              className="inline-flex min-h-11 items-center border border-linen/70 px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-linen"
            >
              Будинки
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:grid-cols-2">
        <Spot className="absolute -left-16 top-10 h-40 w-64 text-beige/80" />
        <div className="relative min-w-0 md:pt-8">
          <p className="kicker text-[0.68rem] text-clay">Буковина на смак і дотик</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.15] text-clay md:text-5xl">
            «Тут не треба поспішати.»
          </h2>
          <p className="mt-6 text-[0.95rem] leading-relaxed">
            DAKH — простір у Мигові, де сучасний спокій зустрічається з духом Карпат.
            Унизу — ресторан: бануш як спогад, а не як страва з меню.
          </p>
        </div>
        <div className="relative min-w-0">
          <Photo
            src={images.pottery}
            alt="Зал DAKH із видом на гори"
            tone={false}
            className="aspect-[4/3] w-full"
          />
        </div>
      </section>

      <HomeCatalog category="rooms" empty="Зараз немає опублікованих кімнат." />
      <HomeCatalog category="houses" empty="Зараз немає опублікованих будинків." />

      <section className="photo-grain relative min-h-[70vh]">
        <Photo src={images.borscht} alt="Миска борщу" className="absolute inset-0 h-full w-full" sizes="100vw" />
        <div className="absolute inset-0 bg-wood/35" />
        <div className="relative flex min-h-[70vh] flex-col items-start justify-end gap-6 px-6 py-20 md:px-16">
          <p className="kicker text-[0.68rem] text-linen/80">Ресторан</p>
          <h2 className="-rotate-1 font-display text-5xl text-linen md:text-6xl">«Тут смакують.»</h2>
          <a
            href={site.restaurantOrder}
            target="_blank"
            rel="noreferrer"
            className="min-h-11 text-[0.72rem] font-medium tracking-[0.16em] uppercase text-linen underline decoration-linen/40 underline-offset-8"
          >
            Переглянути меню
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-28 md:grid-cols-2">
        <Photo
          src={images.diningRoom}
          alt="Зал DAKH зі столами й видом у двір"
          tone={false}
          className="w-full"
        />
        <div>
          <p className="kicker text-[0.68rem] text-clay">{site.city}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">У тихому куточку Карпат</h2>
          <p className="mt-5 text-sm leading-relaxed text-wood/80">
            {site.address}. Гори близько, місто — коли захочете. Якщо шукаєте тишу — вона тут.
          </p>
          <Link
            to="/kontakty"
            className="mt-6 inline-block min-h-11 text-[0.72rem] font-medium tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
          >
            Як нас знайти
          </Link>
        </div>
      </section>
    </>
  )
}

function HomeCatalog({ category, empty }: { category: AccommodationCategory; empty: string }) {
  const catalog = useAccommodationList(category, { defer: true })
  const title = categoryLabel(category)

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="max-w-xl font-display text-4xl leading-tight text-wood">{title}</h2>
        <Link
          to={categoryBase(category)}
          className="text-[0.72rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          Усі
        </Link>
      </div>
      {catalog.status === 'ready' ? (
        <div className="mt-14 grid gap-14 md:grid-cols-3">
          {catalog.items.map((item) => (
            <RoomCard key={item.id} accommodation={item} />
          ))}
        </div>
      ) : (
        <CatalogState status={catalog.status} error={catalog.error} onRetry={catalog.retry} emptyCopy={empty} />
      )}
    </section>
  )
}

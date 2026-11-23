import { Link } from 'react-router-dom'
import { Spot } from '../components/BrandMarks'
import { CatalogState } from '../components/CatalogState'
import { VisitSection } from '../components/VisitSection'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { categoryBase, categoryLabel, type AccommodationCategory } from '../lib/catalog/categories'
import { useAccommodationList } from '../lib/catalog/useAccommodations'
import { images, site } from '../data/catalog'
import { siteBtnOnPhoto, siteBtnPrimary, siteLink } from '../lib/siteChrome'

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
          <p className="kicker text-linen/80">DAKH · Мигове</p>
          <h1 className="-rotate-1 font-display text-5xl leading-[1.05] text-linen md:text-7xl">
            «Вище даху тільки небо»
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-linen/90">
            Номери в будинку й окремі будиночки. Ресторан унизу. Дати обираєте ви, суму підтверджує сервер.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {bookingEnabled ? (
              <Link to="/bronuvannya" className={siteBtnPrimary}>
                Забронювати
              </Link>
            ) : null}
            <Link to="/rooms" className={siteBtnOnPhoto}>
              Номери
            </Link>
            <Link to="/houses" className={siteBtnOnPhoto}>
              Будиночки
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:grid-cols-2">
        <Spot className="absolute -left-16 top-10 h-40 w-64 text-beige/80" />
        <div className="relative min-w-0 md:pt-8">
          <p className="kicker text-clay">Буковина на смак і дотик</p>
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
            className="aspect-[4/3] w-full rounded-[1.6rem]"
          />
        </div>
      </section>

      <HomeCatalog category="rooms" empty="Зараз немає опублікованих номерів." />
      <HomeCatalog category="houses" empty="Зараз немає опублікованих будиночків." />

      <section className="photo-grain relative min-h-[70vh]">
        <Photo
          src={images.restaurantHall}
          alt="Зал ресторану DAKH"
          tone={false}
          className="absolute inset-0 h-full w-full object-[center_80%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-wood/35" />
        <div className="relative flex min-h-[70vh] flex-col items-start justify-end gap-6 px-6 py-20 md:px-16">
          <p className="kicker text-linen/80">Ресторан</p>
          <h2 className="-rotate-1 font-display text-5xl text-linen md:text-6xl">«Тут смакують.»</h2>
          <a
            href={site.restaurantOrder}
            target="_blank"
            rel="noreferrer"
            className={siteBtnPrimary}
          >
            Переглянути меню
          </a>
        </div>
      </section>

      <VisitSection />
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
          className={siteLink}
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

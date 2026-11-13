import { CatalogState } from '../components/CatalogState'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { StayBar } from '../components/StayBar'
import { images } from '../data/catalog'
import { type AccommodationCategory } from '../lib/catalog/categories'
import { useAccommodationList } from '../lib/catalog/useAccommodations'
import { stayUrlFromSearch } from '../lib/publicBooking/stayUrl'
import { useSearchParams } from 'react-router-dom'

const copy = {
  rooms: {
    kicker: 'Готель DAKH',
    title: 'Кімнати',
    lead: 'Сон у будинку, де внизу пахне кухнею. Оберіть дати, щоб перевірити доступність і вартість.',
    empty: 'Зараз немає опублікованих кімнат.',
    photo: images.pottery,
    alt: 'Зал DAKH із видом на гори',
    crop: 'object-[center_35%]',
    columns: 'md:grid-cols-2 xl:grid-cols-3',
    photoShape: 'aspect-[4/5]',
  },
  houses: {
    kicker: 'Окремий поріг',
    title: 'Будинки',
    lead: 'Приватний простір у дворі DAKH. Оберіть дати, щоб перевірити доступність і вартість.',
    empty: 'Зараз немає опублікованих будинків.',
    photo: images.diningRoom,
    alt: 'Зал DAKH зі столами й видом у двір',
    crop: 'object-[center_62%]',
    columns: 'md:grid-cols-2',
    photoShape: 'aspect-[3/2]',
  },
}

export function HotelPage({ category }: { category: AccommodationCategory }) {
  const catalog = useAccommodationList(category)
  const [params] = useSearchParams()
  const stay = stayUrlFromSearch(params)
  const text = copy[category]

  return (
    <article>
      <section className="photo-grain relative min-h-[32svh] md:min-h-[52vh]">
        <Photo
          src={text.photo}
          alt={text.alt}
          tone={false}
          priority
          sizes="100vw"
          className={`absolute inset-0 h-full w-full ${text.crop}`}
        />
        <div className="absolute inset-0 bg-wood/35" />
        <div className="relative flex min-h-[32svh] flex-col justify-end px-6 pb-16 pt-28 md:min-h-[52vh] md:px-10 md:pb-20">
          <p className="kicker text-[0.68rem] text-linen/80">{text.kicker}</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] text-linen md:text-7xl">{text.title}</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-linen/90">{text.lead}</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-6 pb-8 max-sm:pr-28 md:-mt-12">
        <StayBar />
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {catalog.status === 'ready' ? (
          <div className={`grid gap-12 ${text.columns}`}>
            {catalog.items.map((item) => (
              <RoomCard
                key={item.id}
                accommodation={item}
                stay={stay}
                photoClassName={text.photoShape}
              />
            ))}
          </div>
        ) : (
          <CatalogState
            status={catalog.status}
            error={catalog.error}
            onRetry={catalog.retry}
            emptyCopy={text.empty}
            columns={category === 'rooms' ? 3 : 2}
          />
        )}
      </section>
    </article>
  )
}

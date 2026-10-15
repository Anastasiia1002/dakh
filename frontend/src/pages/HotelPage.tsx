import { CatalogState } from '../components/CatalogState'
import { RoomCard } from '../components/RoomCard'
import { useAccommodationList } from '../lib/catalog/useAccommodations'
import type { PublicHotelSlug } from '../lib/publicBooking/types'

const copy = {
  dakh: {
    kicker: 'Готель DAKH',
    title: 'Номери',
    lead: 'Опис і кількість гостей беремо з публічного каталогу. Ціну на цій сторінці не показуємо.',
    empty: 'Зараз немає опублікованих номерів.',
  },
  'sunny-park': {
    kicker: 'Sunny Park',
    title: 'Будинки',
    lead: 'Окремі будинки поруч із DAKH. Місткість беремо з каталогу, а не з числа в назві.',
    empty: 'Зараз немає опублікованих будинків.',
  },
} as const

export function HotelPage({ hotel }: { hotel: PublicHotelSlug }) {
  const catalog = useAccommodationList(hotel)
  const text = copy[hotel]

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">{text.kicker}</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight">{text.title}</h1>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-wood/75">{text.lead}</p>
      {catalog.status === 'ready' ? (
        <div className={`mt-16 grid gap-16 ${hotel === 'dakh' ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
          {catalog.items.map((item) => (
            <RoomCard key={item.id} accommodation={item} />
          ))}
        </div>
      ) : (
        <CatalogState status={catalog.status} error={catalog.error} onRetry={catalog.retry} emptyCopy={text.empty} />
      )}
    </section>
  )
}

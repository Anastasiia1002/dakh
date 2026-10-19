import { CatalogState } from '../components/CatalogState'
import { RoomCard } from '../components/RoomCard'
import { categoryLabel, type AccommodationCategory } from '../lib/catalog/categories'
import { useAccommodationList } from '../lib/catalog/useAccommodations'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

const copy = {
  rooms: {
    title: 'Кімнати',
    lead: 'Опис і кількість гостей беремо з публічного каталогу. Ціну на цій сторінці не показуємо.',
    empty: 'Зараз немає опублікованих кімнат.',
    columns: 3 as const,
  },
  houses: {
    title: 'Будинки',
    lead: 'Окремі будинки поруч із DAKH. Місткість беремо з каталогу, а не з числа в назві.',
    empty: 'Зараз немає опублікованих будинків.',
    columns: 2 as const,
  },
}

export function HotelPage({ category }: { category: AccommodationCategory }) {
  const catalog = useAccommodationList(category)
  const text = copy[category]

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">{categoryLabel(category)}</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight">{text.title}</h1>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-wood/75">{text.lead}</p>
      {bookingEnabled ? (
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-clay">
          Відкрийте {category === 'houses' ? 'будинок' : 'кімнату'}, щоб обрати дати й кількість гостей. Ціна 2 000 ₴ за
          ніч демонстраційна. Оплату на сайті не приймаємо.
        </p>
      ) : null}
      {catalog.status === 'ready' ? (
        <div className={`mt-16 grid gap-16 ${text.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
          {catalog.items.map((item, index) => (
            <RoomCard key={item.id} accommodation={item} priority={index === 0} />
          ))}
        </div>
      ) : (
        <CatalogState
          status={catalog.status}
          error={catalog.error}
          onRetry={catalog.retry}
          emptyCopy={text.empty}
          columns={text.columns}
        />
      )}
    </section>
  )
}

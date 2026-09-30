import { Photo } from '../components/Photo'
import { images, site } from '../data/catalog'
import { RestaurantPage } from './RestaurantPage'

const links = [
  { href: site.restaurantOrder, label: 'Меню' },
  { href: site.restaurantBooking, label: 'Бронювання' },
  { href: site.restaurantDelivery, label: 'Доставка' },
]

export function MenuPage() {
  return (
    <article>
      <section className="relative min-h-[58vh]">
        <Photo
          src={images.restaurantHall}
          alt="Зал ресторану DAKH"
          tone={false}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-wood/40" />
        <div className="relative flex min-h-[58vh] items-end px-6 pb-16 md:px-16">
          <h1 className="font-display text-5xl text-linen md:text-7xl">ресторан</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-20 md:grid-cols-3">
        {links.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-40 items-end bg-beige px-6 py-7 font-display text-4xl text-clay transition hover:bg-clay hover:text-linen"
          >
            {item.label}
          </a>
        ))}
      </section>

      <RestaurantPage />
    </article>
  )
}

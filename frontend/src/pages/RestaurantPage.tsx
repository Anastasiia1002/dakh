import { Link } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { featuredDishes, images } from '../data/catalog'
import { formatMoney } from '../lib/format'

export function RestaurantPage() {
  return (
    <article>
      <section className="relative min-h-[86vh]">
        <Photo src={images.dining} alt="Сервірування столу в DAKH" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-wood/30" />
        <div className="relative flex min-h-[86vh] flex-col items-center justify-center px-6">
          <h1 className="font-display text-7xl text-linen md:text-8xl">dakh</h1>
          <p className="kicker mt-3 text-[0.68rem] text-linen/75">Вище даху тільки небо</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:grid-cols-2">
        <Photo src={images.chef} alt="Кухар збирає тарілку" className="aspect-[4/5] w-full min-w-0" />
        <div className="min-w-0">
          <p className="kicker text-[0.68rem] text-clay">Кухня</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.15] text-balance text-clay">
            Повернення до першоджерел
          </h2>
          <p className="mt-6 text-sm leading-relaxed">
            Сучасна інтерпретація карпатських страв. Чесні продукти, повага до традицій —
            без етнографічної надмірності. Сьогодні пахне хлібом і спокоєм.
          </p>
          <Link
            to="/menu"
            className="mt-8 inline-block text-[0.75rem] tracking-[0.16em] uppercase underline decoration-wood/30 underline-offset-8"
          >
            Відкрити меню
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-4xl">Знакові страви нашого меню</h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {featuredDishes.map((dish) => (
            <Link key={dish.slug} to={`/menu?dish=${dish.slug}`} className="group block">
              <Photo src={dish.image} alt={dish.name} className="aspect-square w-full" />
              <h3 className="mt-5 font-display text-3xl group-hover:text-clay">{dish.name}</h3>
              <p className="mt-2 text-sm text-wood/70">{dish.lead}</p>
              <p className="mt-3 text-sm font-medium">{formatMoney(dish.price)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <h2 className="font-display text-4xl">Краса в деталях</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Photo src={images.interior} alt="Зал ресторану" className="aspect-[3/4] w-full" />
          <Photo src={images.chef} alt="Руки на кухні" className="aspect-[3/4] w-full md:mt-12" />
          <Photo src={images.cocktail} alt="Склянка настоянки" className="aspect-[3/4] w-full" />
        </div>
      </section>
    </article>
  )
}

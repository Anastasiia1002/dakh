import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { dishes, images, menuCategories, type Dish, type MenuCategory } from '../data/catalog'
import { formatMoney } from '../lib/format'

export function MenuPage() {
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState<MenuCategory | 'all'>('all')
  const selected = dishes.find((dish) => dish.slug === params.get('dish')) ?? null

  const list = useMemo(
    () => dishes.filter((dish) => category === 'all' || dish.category === category),
    [category],
  )

  function openDish(dish: Dish) {
    setParams({ dish: dish.slug })
  }

  function close() {
    setParams({})
  }

  return (
    <article>
      <section className="relative min-h-[58vh]">
        <Photo
          src={images.restaurantDark}
          alt="Зал ресторану ввечері"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-wood/45" />
        <div className="relative flex min-h-[58vh] items-end px-6 pb-16 md:px-16">
          <h1 className="font-display text-5xl text-linen md:text-7xl">Меню DAKH</h1>
        </div>
      </section>

      <nav className="sticky top-0 z-20 flex flex-wrap gap-x-8 gap-y-2 border-b border-wood/10 bg-linen/95 px-6 py-5 text-[0.75rem] tracking-[0.16em] uppercase">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={category === 'all' ? 'text-clay' : 'text-wood/60'}
        >
          Усе
        </button>
        {menuCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={category === item.id ? 'text-clay' : 'text-wood/60'}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="bg-forest px-6 py-16 text-center text-linen">
        <p className="font-display text-4xl md:text-5xl">«Перший подих карпатських лугів»</p>
      </div>

      <section className="mx-auto grid max-w-5xl gap-x-16 gap-y-10 px-6 py-20 md:grid-cols-2">
        {list.map((dish) => (
          <button
            key={dish.slug}
            type="button"
            onClick={() => openDish(dish)}
            className="grid grid-cols-[88px_1fr] gap-5 text-left"
          >
            <Photo src={dish.image} alt="" className="h-[88px] w-[88px]" />
            <span>
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{dish.name}</span>
                <span className="shrink-0 text-sm">{formatMoney(dish.price)}</span>
              </span>
              <span className="mt-1 block text-sm text-wood/65">{dish.lead}</span>
            </span>
          </button>
        ))}
      </section>

      {selected ? <DishModal dish={selected} onClose={close} /> : null}
    </article>
  )
}

function DishModal({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-wood/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-auto bg-linen"
        onClick={(event) => event.stopPropagation()}
      >
        <Photo src={dish.image} alt={dish.name} className="h-72 w-full" />
        <div className="px-8 py-8">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase text-clay">
            {menuCategories.find((item) => item.id === dish.category)?.label}
          </p>
          <h2 id="dish-title" className="mt-2 font-display text-4xl">
            {dish.name}
          </h2>
          <p className="mt-4 text-wood/75">{dish.lead}</p>
          <p className="mt-4 text-sm leading-relaxed text-wood/70">{dish.ingredients}</p>
          <p className="mt-6 text-lg font-medium">{formatMoney(dish.price)}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  )
}

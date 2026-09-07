import { BirdMark } from '../components/BrandMarks'
import { Photo } from '../components/Photo'
import { images, site } from '../data/catalog'

export function AboutPage() {
  return (
    <article className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="kicker text-[0.68rem] text-clay">Про нас</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight text-clay">
        Місце, де тиша має звук
      </h1>
      <p className="mt-8 max-w-2xl leading-relaxed">
        Sunny Park і DAKH працюють як одна екосистема: дах над головою, стіл унизу, ліс за
        хвірткою. Ми не доводимо словами — показуємо атмосферою. Якщо фраза звучить як
        реклама, ми її викреслюємо.
      </p>

      <div className="relative mt-16 grid gap-4 md:grid-cols-2">
        <BirdMark className="absolute -right-2 -top-6 h-10 w-16 text-clay/70" />
        <Photo src={images.heroHouse} alt="Двір і дах" className="aspect-[4/3] w-full" />
        <Photo src={images.forest} alt="Світло між деревами" className="aspect-[4/3] w-full grayscale" />
      </div>

      <section className="mt-20 grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-clay">DAKH</h2>
          <p className="mt-4 text-sm leading-relaxed text-wood/75">
            Ресторан — серце смаку. Гуцульське, локальне, сезонне. Стіл на сайті не
            бронюємо: зателефонуйте або зайдіть, як зайдете.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl">{site.hotel}</h2>
          <p className="mt-4 text-sm leading-relaxed text-wood/75">
            {site.city}, {site.region}. Кімнати для тих, хто їде не «кудись», а заради
            тиші, світла на дереві й вечері, після якої хочеться помовчати.
          </p>
        </div>
      </section>
    </article>
  )
}

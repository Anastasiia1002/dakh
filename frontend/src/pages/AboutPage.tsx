import { Link } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { images, site } from '../data/catalog'
import { asset } from '../lib/asset'

const sectionLink =
  'text-[0.72rem] font-medium tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4'

export function AboutPage() {
  return (
    <article>
      <section className="photo-grain relative min-h-[42svh] md:min-h-[56vh]">
        <Photo
          src={images.heroHouse}
          alt="DAKH увечері"
          tone={false}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-wood/40" />
        <div className="relative flex min-h-[42svh] flex-col justify-end px-6 pb-16 pt-28 md:min-h-[56vh] md:px-10 md:pb-20">
          <p className="kicker text-[0.68rem] text-linen/80">Про нас</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[1.08] text-linen md:text-7xl">
            Місце, де тиша має звук
          </h1>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
      <p className="max-w-2xl leading-relaxed">
        DAKH — готель і ресторан у Мигові: дах над головою, стіл унизу, ліс за хвірткою.
        Ми не доводимо словами — показуємо атмосферою. Якщо фраза звучить як реклама, ми її
        викреслюємо.
      </p>
      <nav className="mt-8 flex flex-wrap gap-x-8 gap-y-3" aria-label="Розділи DAKH">
        <Link to="/rooms" className={sectionLink}>
          Кімнати
        </Link>
        <Link to="/houses" className={sectionLink}>
          Будинки
        </Link>
        <Link to="/menu" className={sectionLink}>
          Ресторан
        </Link>
      </nav>

      <div className="relative mt-16 grid gap-4 md:grid-cols-2">
        <img
          src={asset('images/dakh-logo-wood.png')}
          alt=""
          className="absolute -right-2 -top-8 h-12 w-auto opacity-70"
        />
        <Photo src={images.heroHouse} alt="DAKH увечері" tone={false} className="aspect-[4/3] w-full" />
        <Photo src={images.pottery} alt="Зал DAKH із диванами й видом на гори" tone={false} className="aspect-[4/3] w-full" />
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
          <h2 className="font-display text-3xl">Готель</h2>
          <p className="mt-4 text-sm leading-relaxed text-wood/75">
            {site.city}, {site.region}. Кімнати для тих, хто їде не «кудись», а заради
            тиші, світла на дереві й вечері, після якої хочеться помовчати.
          </p>
        </div>
      </section>
      </div>
    </article>
  )
}

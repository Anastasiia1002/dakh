import { Link } from 'react-router-dom'
import { Spot } from '../components/BrandMarks'
import { FlyingBird } from '../components/FlyingBird'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { images, site, stays } from '../data/catalog'

export function HomePage() {
  return (
    <>
      <FlyingBird />
      <section className="photo-grain relative min-h-[92vh]">
        <Photo
          src={images.heroHouse}
          alt="DAKH увечері"
          tone={false}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-wood/30" />
        <div className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pt-24">
          <p className="kicker text-[0.68rem] text-linen/80">DAKH · Мигове</p>
          <h1 className="-rotate-1 font-display text-5xl leading-[1.05] text-linen md:text-7xl">
            «Вище даху тільки небо»
          </h1>
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
          <Photo src={images.pottery} alt="Кераміка й лляні тканини" className="aspect-[4/5] w-full" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <p className="kicker text-[0.68rem] text-wood/55">Готель</p>
        <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight text-wood">
          Простір, сповнений світла й текстур
        </h2>
        <div className="mt-14 grid gap-14 md:grid-cols-3">
          {stays.map((stay) => (
            <RoomCard key={stay.slug} stay={stay} />
          ))}
        </div>
      </section>

      <section className="photo-grain relative min-h-[70vh]">
        <Photo src={images.borscht} alt="Миска борщу" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-wood/35" />
        <div className="relative flex min-h-[70vh] flex-col items-start justify-end gap-6 px-6 py-20 md:px-16">
          <p className="kicker text-[0.68rem] text-linen/80">Ресторан</p>
          <h2 className="-rotate-1 font-display text-5xl text-linen md:text-6xl">«Тут смакують.»</h2>
          <Link
            to="/restoran"
            className="text-[0.72rem] font-medium tracking-[0.16em] uppercase text-linen underline decoration-linen/40 underline-offset-8"
          >
            DAKH
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-28 md:grid-cols-2">
        <MapSketch />
        <div>
          <p className="kicker text-[0.68rem] text-clay">{site.city}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">У тихому куточку Карпат</h2>
          <p className="mt-5 text-sm leading-relaxed text-wood/80">
            {site.address}. Гори близько, місто — коли захочете. Якщо шукаєте тишу — вона тут.
          </p>
          <Link
            to="/kontakty"
            className="mt-6 inline-block text-[0.72rem] font-medium tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
          >
            Як нас знайти
          </Link>
        </div>
      </section>
    </>
  )
}

function MapSketch() {
  return (
    <svg viewBox="0 0 480 320" className="w-full bg-beige text-wood" aria-label="Схема Мигове">
      <rect width="480" height="320" fill="#e9dcce" />
      <path d="M20 210 C80 170 160 150 260 168 C340 184 400 150 460 130" fill="none" stroke="#5b382b" strokeOpacity="0.28" />
      <path d="M40 240 L120 150 L170 190 L260 120 L440 240" fill="none" stroke="#2f3f23" strokeWidth="1.2" />
      <path d="M210 70 C230 50 250 50 255 70 C240 68 226 74 210 70Z" fill="#5b382b" />
      <text x="255" y="278" textAnchor="middle" fill="#b25f38" fontSize="18" fontFamily="Marck Script, cursive">
        dakh
      </text>
      <text x="36" y="40" fill="#5b382b" fillOpacity="0.5" fontSize="11">
        Мигове
      </text>
    </svg>
  )
}

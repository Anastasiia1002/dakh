import { Link } from 'react-router-dom'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { images, site, stays } from '../data/catalog'

export function HomePage() {
  return (
    <>
      <section className="relative min-h-[92vh]">
        <Photo src={images.heroHouse} alt="Дерев’яний дім серед саду" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-wood/25" />
        <div className="relative flex min-h-[92vh] items-end px-6 pb-24 pt-32 md:items-center md:justify-center md:pb-0">
          <h1 className="max-w-4xl text-center font-display text-5xl leading-[1.05] text-linen md:text-7xl">
            «Вище даху тільки небо»
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:grid-cols-2">
        <div className="min-w-0 md:pt-8">
          <h2 className="font-display text-4xl leading-[1.15] md:text-5xl">«Тут не треба поспішати.»</h2>
          <p className="mt-6 text-[0.95rem] leading-relaxed text-wood/80">
            DAKH стоїть у тихому кутку старого міста. Кімнати — світлі й майже порожні.
            Унизу готують борщ і бануш. Між дахом і небом — лише повітря Чернівців.
          </p>
        </div>
        <div className="min-w-0">
          <Photo src={images.pottery} alt="Кераміка й лляні тканини" className="aspect-[4/5] w-full" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="max-w-xl font-display text-4xl leading-tight">
          Простір, сповнений світла й текстур
        </h2>
        <div className="mt-14 grid gap-14 md:grid-cols-3">
          {stays.map((stay) => (
            <RoomCard key={stay.slug} stay={stay} />
          ))}
        </div>
      </section>

      <section className="relative min-h-[70vh]">
        <Photo src={images.borscht} alt="Миска борщу" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-wood/35" />
        <div className="relative flex min-h-[70vh] flex-col items-start justify-end gap-6 px-6 py-20 md:px-16">
          <h2 className="max-w-2xl font-display text-5xl text-linen md:text-6xl">«Тут смакують.»</h2>
          <Link
            to="/restoran"
            className="text-[0.75rem] tracking-[0.16em] uppercase text-linen underline decoration-linen/40 underline-offset-8"
          >
            Ресторан DAKH
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-28 md:grid-cols-2">
        <MapSketch />
        <div>
          <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">{site.city}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">У тихому куточку старого міста</h2>
          <p className="mt-5 text-sm leading-relaxed text-wood/80">
            {site.address}. Пішки до площі — кілька хвилин, до шуму — трохи далі, ніж здається.
          </p>
          <Link
            to="/kontakty"
            className="mt-6 inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
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
    <svg viewBox="0 0 480 320" className="w-full bg-beige text-wood" aria-label="Схема кварталу">
      <rect width="480" height="320" fill="#e9dcce" />
      <path d="M40 220 H440" fill="none" stroke="#56382b" strokeOpacity="0.25" />
      <path d="M180 40 V280" fill="none" stroke="#56382b" strokeOpacity="0.25" />
      <rect x="210" y="90" width="90" height="70" fill="none" stroke="#2f3f23" strokeWidth="1.4" />
      <text x="255" y="130" textAnchor="middle" fill="#56382b" fontSize="14" fontFamily="serif">
        DAKH
      </text>
      <circle cx="255" cy="200" r="5" fill="#b25f38" />
      <text x="270" y="204" fill="#56382b" fontSize="11" fontFamily="sans-serif">
        Кобилянської
      </text>
      <text x="50" y="50" fill="#56382b" fillOpacity="0.55" fontSize="11">
        старе місто
      </text>
    </svg>
  )
}

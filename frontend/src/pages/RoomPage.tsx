import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AmenityIcon } from '../components/AmenityIcon'
import { RoomBooking } from '../components/booking/RoomBooking'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { stayBySlug, stays } from '../data/catalog'
import { formatMoney } from '../lib/format'
import { isPublicApiConfigured } from '../lib/publicBooking/config'

export function RoomPage() {
  const { slug = '' } = useParams()
  const stay = stayBySlug(slug)
  const [active, setActive] = useState(0)

  if (!stay) return <Navigate to="/gotel" replace />

  const room = stay
  const similar = stays.filter((item) => item.slug !== room.slug)

  return (
    <article>
      <Photo src={room.images[active]} alt={room.name} className="h-[70vh] w-full" />
      <div className="mx-auto grid max-w-6xl grid-cols-5 gap-2 px-6 pt-3">
        {room.images.map((src, index) => (
          <button key={src} type="button" onClick={() => setActive(index)} className="block">
            <Photo
              src={src}
              alt=""
              className={`aspect-[4/3] w-full ${index === active ? 'ring-1 ring-clay' : 'opacity-70'}`}
            />
          </button>
        ))}
      </div>

      <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)] lg:gap-16">
        <div className="min-w-0">
          <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">{room.kicker}</p>
          <h1 className="mt-2 font-display text-5xl">{room.name}</h1>
          <p className="mt-4 text-lg font-medium">
            {formatMoney(room.priceFrom)} <span className="text-sm font-normal text-wood/60">/ доба, орієнтир каталогу</span>
          </p>
          {isPublicApiConfigured() ? (
            <p className="mt-2 max-w-xl text-sm text-wood/60">
              Це не сума за обрані дати. У картці дат показана тестова ціна сервера.
            </p>
          ) : null}
          <p className="mt-3 text-sm text-wood/70">
            {room.area} м² · до {room.guests}
            {room.extraKids ? ' + діти' : ''} · {room.rooms} кімн.
          </p>
          <p className="mt-8 max-w-xl leading-relaxed text-wood/80">{room.description}</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {room.amenities.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <AmenityIcon name={item.icon} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <RoomBooking catalogSlug={room.slug} />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-4xl">Спробуйте також</h2>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          {similar.map((item) => (
            <RoomCard key={item.slug} stay={item} />
          ))}
        </div>
        <Link
          to="/gotel"
          className="mt-10 inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          Усі кімнати
        </Link>
      </section>
    </article>
  )
}

import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AmenityIcon } from '../components/AmenityIcon'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { stayBySlug, stays } from '../data/catalog'
import { addDays, formatMoney, todayIso } from '../lib/format'

export function RoomPage() {
  const { slug = '' } = useParams()
  const stay = stayBySlug(slug)
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [checkIn, setCheckIn] = useState(todayIso())
  const [checkOut, setCheckOut] = useState(addDays(todayIso(), 2))
  const [adults, setAdults] = useState(2)

  if (!stay) return <Navigate to="/gotel" replace />

  const room = stay
  const similar = stays.filter((item) => item.slug !== room.slug)

  function book() {
    const params = new URLSearchParams({
      from: checkIn,
      to: checkOut,
      adults: String(adults),
      children: '0',
      stay: room.slug,
    })
    navigate(`/bronuvannya?${params.toString()}`)
  }

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

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-16 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">{room.kicker}</p>
          <h1 className="mt-2 font-display text-5xl">{room.name}</h1>
          <p className="mt-4 text-lg font-medium">
            {formatMoney(room.priceFrom)} <span className="text-sm font-normal text-wood/60">/ доба</span>
          </p>
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

        <aside className="h-fit bg-beige p-6 md:col-span-5">
          <p className="text-[0.7rem] tracking-[0.16em] uppercase">Дати</p>
          <label className="mt-4 block text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Заїзд
            <input
              type="date"
              value={checkIn}
              min={todayIso()}
              onChange={(event) => {
                const next = event.target.value
                setCheckIn(next)
                if (checkOut <= next) setCheckOut(addDays(next, 1))
              }}
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
            />
          </label>
          <label className="mt-4 block text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Виїзд
            <input
              type="date"
              value={checkOut}
              min={addDays(checkIn, 1)}
              onChange={(event) => setCheckOut(event.target.value)}
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
            />
          </label>
          <label className="mt-4 block text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Гості
            <input
              type="number"
              min={1}
              max={room.guests}
              value={adults}
              onChange={(event) => setAdults(Number(event.target.value))}
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
            />
          </label>
          <button
            type="button"
            onClick={book}
            className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen"
          >
            Забронювати
          </button>
          <p className="mt-3 text-[0.72rem] text-wood/55">
            Заявка лишається в localStorage. Оплати онлайн немає.
          </p>
        </aside>
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

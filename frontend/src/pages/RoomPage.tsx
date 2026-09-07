import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AmenityIcon } from '../components/AmenityIcon'
import { BookingCalendar } from '../components/BookingCalendar'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { stayBySlug, stays } from '../data/catalog'
import { loadBookings, stayAvailable, stayFitsGuests } from '../lib/booking'
import { formatMoney } from '../lib/format'

export function RoomPage() {
  const { slug = '' } = useParams()
  const stay = stayBySlug(slug)
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const bookings = loadBookings()

  if (!stay) return <Navigate to="/gotel" replace />

  const room = stay
  const similar = stays.filter((item) => item.slug !== room.slug)

  function book() {
    if (!checkIn || !checkOut) return
    if (!stayFitsGuests(room, adults, children)) return
    if (!stayAvailable(room, checkIn, checkOut, bookings)) return
    const params = new URLSearchParams({
      from: checkIn,
      to: checkOut,
      adults: String(adults),
      children: String(children),
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
          <div className="mt-4">
            <BookingCalendar
              align="end"
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              kids={children}
              staySlug={room.slug}
              stays={stays}
              bookings={bookings}
              onChange={(next) => {
                if (next.checkIn !== undefined) setCheckIn(next.checkIn)
                if (next.checkOut !== undefined) setCheckOut(next.checkOut)
                if (next.adults !== undefined) setAdults(next.adults)
                if (next.children !== undefined) setChildren(next.children)
              }}
            />
          </div>
          <button
            type="button"
            onClick={book}
            disabled={!checkIn || !checkOut || !stayAvailable(room, checkIn, checkOut, bookings)}
            className="mt-8 w-full bg-clay py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:opacity-40"
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

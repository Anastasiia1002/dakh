import { RoomCard } from '../components/RoomCard'
import { stays } from '../data/catalog'

export function HotelPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">Готель</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight">Три кімнати під одним дахом</h1>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-wood/75">
        Мало дверей, багато повітря. Сніданок — унизу, в залі ресторану. Бронювання кімнати
        зберігається в цьому браузері.
      </p>
      <div className="mt-16 grid gap-16 md:grid-cols-3">
        {stays.map((stay) => (
          <RoomCard key={stay.slug} stay={stay} />
        ))}
      </div>
    </section>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, todayIso } from '../lib/format'

type Props = {
  staySlug?: string
  compact?: boolean
}

export function BookingBar({ staySlug, compact }: Props) {
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState(todayIso())
  const [checkOut, setCheckOut] = useState(addDays(todayIso(), 2))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  function submit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams({
      from: checkIn,
      to: checkOut,
      adults: String(adults),
      children: String(children),
    })
    if (staySlug) params.set('stay', staySlug)
    navigate(`/bronuvannya?${params.toString()}`)
  }

  return (
    <form className={compact ? 'book-bar is-compact' : 'book-bar'} onSubmit={submit}>
      <label>
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
          required
        />
      </label>
      <label>
        Виїзд
        <input
          type="date"
          value={checkOut}
          min={addDays(checkIn, 1)}
          onChange={(event) => setCheckOut(event.target.value)}
          required
        />
      </label>
      <label>
        Дорослі
        <input
          type="number"
          min={1}
          max={12}
          value={adults}
          onChange={(event) => setAdults(Number(event.target.value))}
        />
      </label>
      <label>
        Діти
        <input
          type="number"
          min={0}
          max={8}
          value={children}
          onChange={(event) => setChildren(Number(event.target.value))}
        />
      </label>
      <button className="btn btn-sun" type="submit">
        Перевірити дати
      </button>
    </form>
  )
}

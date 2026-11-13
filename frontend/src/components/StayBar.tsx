import { useSearchParams } from 'react-router-dom'
import { stayUrlFromSearch, type StayUrlState } from '../lib/publicBooking/stayUrl'

export function StayBar() {
  const [params, setParams] = useSearchParams()
  const stay = stayUrlFromSearch(params)

  function patch(next: Partial<StayUrlState>) {
    const merged = { ...stay, ...next }
    const copy = new URLSearchParams(params)
    if (merged.from) copy.set('from', merged.from)
    else copy.delete('from')
    if (merged.to && merged.from && merged.to > merged.from) copy.set('to', merged.to)
    else copy.delete('to')
    if (merged.adults !== 2) copy.set('adults', String(merged.adults))
    else copy.delete('adults')
    if (merged.children !== 0) copy.set('children', String(merged.children))
    else copy.delete('children')
    setParams(copy, { replace: true })
  }

  return (
    <form
      id="stay-dates"
      className="grid gap-3 border border-wood/10 bg-linen p-4 shadow-[0_18px_40px_rgba(91,56,43,0.12)] sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="text-sm">
        <span className="mb-1 block text-[0.72rem] tracking-[0.12em] uppercase text-wood/55">Заїзд</span>
        <input
          type="date"
          value={stay.from}
          onChange={(event) => patch({ from: event.target.value, to: stay.to && event.target.value >= stay.to ? '' : stay.to })}
          className="w-full border border-wood/15 bg-linen px-3 py-2.5 text-base text-wood"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-[0.72rem] tracking-[0.12em] uppercase text-wood/55">Виїзд</span>
        <input
          type="date"
          value={stay.to}
          min={stay.from || undefined}
          onChange={(event) => patch({ to: event.target.value })}
          className="w-full border border-wood/15 bg-linen px-3 py-2.5 text-base text-wood"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-[0.72rem] tracking-[0.12em] uppercase text-wood/55">Дорослі</span>
        <input
          type="number"
          min={1}
          max={12}
          value={stay.adults}
          onChange={(event) => patch({ adults: Number(event.target.value) || 1 })}
          className="w-full border border-wood/15 bg-linen px-3 py-2.5 text-base text-wood"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-[0.72rem] tracking-[0.12em] uppercase text-wood/55">Діти</span>
        <input
          type="number"
          min={0}
          max={12}
          value={stay.children}
          onChange={(event) => patch({ children: Number(event.target.value) || 0 })}
          className="w-full border border-wood/15 bg-linen px-3 py-2.5 text-base text-wood"
        />
      </label>
    </form>
  )
}

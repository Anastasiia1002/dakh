import { useMemo, useState } from 'react'
import { StayCard } from '../components/StayCard'
import { stays, type StayKind } from '../data/catalog'

type Filter = 'all' | StayKind

export function StaysPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const list = useMemo(
    () => stays.filter((stay) => filter === 'all' || stay.kind === filter),
    [filter],
  )

  return (
    <section className="page">
      <header className="page-hero">
        <p className="eyebrow">Каталог</p>
        <h1>Проживання</h1>
        <p className="lede">
          Номери для короткої втечі й таунхауси, коли потрібен свій дах, кухня
          й тераса. Ціни — за ніч, сніданок зазначено в картці.
        </p>
        <div className="filters" role="tablist" aria-label="Тип житла">
          {(
            [
              ['all', 'Усе'],
              ['room', 'Номери'],
              ['townhouse', 'Таунхауси'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'is-active' : undefined}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="card-grid">
        {list.map((stay) => (
          <StayCard key={stay.slug} stay={stay} />
        ))}
      </div>
    </section>
  )
}

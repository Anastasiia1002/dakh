import { Link } from 'react-router-dom'
import type { Stay } from '../data/catalog'
import { formatMoney } from '../lib/format'

type Props = {
  stay: Stay
  available?: boolean
  nights?: number
  selectable?: boolean
}

export function StayCard({ stay, available = true, nights, selectable }: Props) {
  const total = nights && nights > 0 ? stay.priceFrom * nights : null
  const href = `/prozhivannya/${stay.slug}`

  return (
    <article className="stay-card">
      {selectable ? (
        <div className="stay-card-media">
          <img src={stay.images[0]} alt="" />
          <span className="chip">{stay.kicker}</span>
        </div>
      ) : (
        <Link className="stay-card-media" to={href}>
          <img src={stay.images[0]} alt="" />
          <span className="chip">{stay.kicker}</span>
        </Link>
      )}
      <div className="stay-card-body">
        <p className="eyebrow">{stay.kind === 'room' ? 'Номер' : 'Таунхаус'}</p>
        <h3>{selectable ? stay.name : <Link to={href}>{stay.name}</Link>}</h3>
        <p>{stay.summary}</p>
        <ul className="spec-row">
          <li>{stay.area} м²</li>
          <li>
            до {stay.guests}
            {stay.extraKids ? ' + діти' : ''} гостей
          </li>
          <li>{stay.rooms} кімн.</li>
        </ul>
        <div className="stay-card-foot">
          <div>
            <strong>{formatMoney(stay.priceFrom)}</strong>
            <span> / ніч</span>
            {total ? <p className="muted">{formatMoney(total)} за {nights} н.</p> : null}
          </div>
          {selectable ? (
            <span className={available ? 'pick' : 'sold'}>
              {available ? 'Обрати' : 'Недоступно'}
            </span>
          ) : available ? (
            <Link className="btn btn-ghost" to={href}>
              Деталі
            </Link>
          ) : (
            <span className="sold">Зайнято на ці дати</span>
          )}
        </div>
      </div>
    </article>
  )
}

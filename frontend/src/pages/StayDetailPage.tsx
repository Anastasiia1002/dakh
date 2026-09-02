import { Link, Navigate, useParams } from 'react-router-dom'
import { BookingBar } from '../components/BookingBar'
import { StayCard } from '../components/StayCard'
import { stayBySlug, stays } from '../data/catalog'
import { formatMoney } from '../lib/format'

export function StayDetailPage() {
  const { slug = '' } = useParams()
  const stay = stayBySlug(slug)

  if (!stay) return <Navigate to="/prozhivannya" replace />

  const similar = stays.filter((item) => item.slug !== stay.slug).slice(0, 3)

  return (
    <article className="page stay-page">
      <header className="stay-hero">
        <div className="stay-gallery">
          {stay.images.map((src, index) => (
            <img key={src} src={src} alt={index === 0 ? stay.name : ''} />
          ))}
        </div>
        <div className="stay-intro">
          <p className="eyebrow">{stay.kind === 'room' ? 'Номер' : 'Таунхаус'}</p>
          <h1>{stay.name}</h1>
          <p className="lede">{stay.description}</p>
          <ul className="spec-row is-large">
            <li>{stay.area} м²</li>
            <li>
              до {stay.guests}
              {stay.extraKids ? ' + діти' : ''}
            </li>
            <li>{stay.rooms} кімн.</li>
            <li>{stay.bathrooms} ванн.</li>
            <li>{stay.floors} пов.</li>
          </ul>
          <p className="price-line">
            <strong>{formatMoney(stay.priceFrom)}</strong>
            <span> / ніч{stay.breakfast ? ' · сніданок включено' : ' · сніданок окремо'}</span>
          </p>
          <BookingBar staySlug={stay.slug} compact />
        </div>
      </header>

      <section className="section">
        <h2>Простір</h2>
        <div className="space-grid">
          {stay.spaces.map((space) => (
            <div key={space.title} className="space-card">
              <h3>{space.title}</h3>
              <ul>
                {space.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <ul className="pill-row">
          {stay.amenities.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {stay.parking ? <li>Паркінг</li> : null}
        </ul>
        <p className="muted">
          Зайняті проміжки в прототипі:{' '}
          {stay.blocked.length
            ? stay.blocked.map((range) => `${range.from} — ${range.to}`).join('; ')
            : 'вільно на найближчі дати'}
          .
        </p>
        <Link className="text-link" to="/bronuvannya">
          Перейти до бронювання
        </Link>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Інші варіанти</h2>
        </div>
        <div className="card-grid">
          {similar.map((item) => (
            <StayCard key={item.slug} stay={item} />
          ))}
        </div>
      </section>
    </article>
  )
}

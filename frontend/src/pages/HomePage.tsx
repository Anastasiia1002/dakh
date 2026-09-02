import { Link } from 'react-router-dom'
import { BookingBar } from '../components/BookingBar'
import { StayCard } from '../components/StayCard'
import { faqs, images, site, stays } from '../data/catalog'
import { formatMoney } from '../lib/format'

const featured = stays.filter((stay) =>
  ['odnokimnatnyi', 'dvokimnatnyi', 'taunkhaus-3', 'premium'].includes(stay.slug),
)

export function HomePage() {
  return (
    <>
      <section className="hero">
        <img src={images.hero} alt="Карпатські хребти над хвойним лісом" />
        <div className="hero-copy">
          <p className="eyebrow">Мигове · Чернівецька область</p>
          <h1>
            Дах над Карпатами,
            <em> світло на терасах.</em>
          </h1>
          <p className="lede">
            Sunny Park — комплекс на понад {site.hectares} гектарах: номери,
            таунхауси, SPA з басейнами й ресторан LA Terrace. Бронювання з
            календаря, без шаблонного «агентства нерухомості».
          </p>
        </div>
        <div className="hero-bar">
          <BookingBar />
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">Комплекс</p>
          <h2>Ліс, вода й окремі дахи — в одному дворі.</h2>
          <p>
            Мигове тримає тишу навіть у сезон. Гості живуть у номерах або
            власних таунхаусах, спускаються в SPA й вечеряють у залі на 80
            місць з терасою. Паркінг охороняється, сніданок входить у більшість
            тарифів.
          </p>
          <Link className="text-link" to="/prozhivannya">
            Дивитися проживання
          </Link>
        </div>
        <ul className="stat-grid">
          <li>
            <strong>{site.hectares} га</strong>
            <span>територія серед хвої</span>
          </li>
          <li>
            <strong>{stays.length}</strong>
            <span>категорій житла</span>
          </li>
          <li>
            <strong>10×15</strong>
            <span>закритий басейн SPA</span>
          </li>
          <li>
            <strong>від {formatMoney(3500)}</strong>
            <span>ніч у номері</span>
          </li>
        </ul>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Проживання</p>
            <h2>Від кімнати на двох до окремого будинку.</h2>
          </div>
          <Link className="btn btn-ghost" to="/prozhivannya">
            Увесь каталог
          </Link>
        </div>
        <div className="card-grid">
          {featured.map((stay) => (
            <StayCard key={stay.slug} stay={stay} />
          ))}
        </div>
      </section>

      <section className="mosaic">
        <figure>
          <img src={images.forest} alt="Сонце крізь стовбури лісу" />
          <figcaption>
            <p className="eyebrow">01 · Територія</p>
            <h3>Хвойний край за кілька кроків від дверей.</h3>
          </figcaption>
        </figure>
        <figure>
          <img src={images.pool} alt="Крилатий простір басейну" />
          <figcaption>
            <p className="eyebrow">02 · SPA</p>
            <h3>Басейни, сауни, хамам і сіль.</h3>
            <Link to="/spa">Розклад і ціни</Link>
          </figcaption>
        </figure>
        <figure>
          <img src={images.terrace} alt="Сервірування на терасі ресторану" />
          <figcaption>
            <p className="eyebrow">03 · LA Terrace</p>
            <h3>Кухня Карпат із європейським акцентом.</h3>
            <Link to="/restoran">Меню вечора</Link>
          </figcaption>
        </figure>
      </section>

      <section className="section faq-band">
        <div>
          <p className="eyebrow">Перед поїздкою</p>
          <h2>Коротко про заїзд, тварин і паркінг.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}

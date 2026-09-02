import { images, spaFacilities, spaPrices } from '../data/catalog'
import { formatMoney } from '../lib/format'

export function SpaPage() {
  return (
    <article className="page">
      <header className="page-hero is-photo">
        <img src={images.pool} alt="Басейн SPA-комплексу" />
        <div>
          <p className="eyebrow">Вода й тепло</p>
          <h1>SPA</h1>
          <p className="lede">
            Закритий басейн 10×15, літня чаша просто неба, дитячий басейн,
            фінська та фіто-сауни, хамам і соляна кімната. Халат і рушник уже
            в тарифі.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="facility-grid">
          {spaFacilities.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <img className="panel-photo" src={images.spa} alt="Зона відпочинку SPA" />
        <div className="price-stack">
          <p className="eyebrow">Для гостей комплексу</p>
          <table>
            <thead>
              <tr>
                <th>Дні</th>
                <th>Від 14 років</th>
                <th>3–14 років</th>
              </tr>
            </thead>
            <tbody>
              {spaPrices.residents.map((row) => (
                <tr key={row.when}>
                  <td>{row.when}</td>
                  <td>{formatMoney(row.adult)}</td>
                  <td>{formatMoney(row.child)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="eyebrow">Для відвідувачів</p>
          <table>
            <thead>
              <tr>
                <th>Сеанс</th>
                <th>Від 14 років</th>
                <th>3–14 років</th>
              </tr>
            </thead>
            <tbody>
              {spaPrices.visitors.map((row) => (
                <tr key={row.when}>
                  <td>{row.when}</td>
                  <td>{formatMoney(row.adult)}</td>
                  <td>{formatMoney(row.child)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="note-list">
            {spaPrices.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  )
}

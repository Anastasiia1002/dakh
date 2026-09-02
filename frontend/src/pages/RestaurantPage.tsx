import { images, menuHighlights } from '../data/catalog'

export function RestaurantPage() {
  return (
    <article className="page">
      <header className="page-hero is-photo">
        <img src={images.restaurant} alt="Страва ресторану LA Terrace" />
        <div>
          <p className="eyebrow">Кухня</p>
          <h1>LA Terrace</h1>
          <p className="lede">
            Світлий зал до 80 гостей, панорамні вікна й відкрита тераса.
            Українська та європейська кухня на локальних продуктах — вечеря,
            родина, день народження чи камерний корпоратив.
          </p>
        </div>
      </header>

      <section className="section split">
        <div>
          <p className="eyebrow">Атмосфера</p>
          <h2>Дерево, камінь і вид на схили.</h2>
          <p>
            Ресторан зібраний як продовження тераси: тепле світло, довгі столи,
            місце для тосту й для тихої вечері після SPA. Сніданки для гостей
            комплексу подаємо тут же.
          </p>
        </div>
        <img className="panel-photo" src={images.terrace} alt="Тераса ресторану" />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">На вечір</p>
            <h2>Кілька страв, з яких починається розмова.</h2>
          </div>
        </div>
        <ol className="menu-list">
          {menuHighlights.map((item) => (
            <li key={item.dish}>
              <span>{item.course}</span>
              <strong>{item.dish}</strong>
              <em>{item.note}</em>
            </li>
          ))}
        </ol>
        <p className="muted">
          Меню змінюється з сезоном. Актуальну карту уточнюйте на рецепції або
          телефоном.
        </p>
      </section>
    </article>
  )
}

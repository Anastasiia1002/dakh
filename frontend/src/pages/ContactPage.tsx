import { useState, type FormEvent } from 'react'
import { faqs, site } from '../data/catalog'

export function ContactPage() {
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <article className="page">
      <header className="page-hero">
        <p className="eyebrow">Рецепція</p>
        <h1>Контакти</h1>
        <p className="lede">
          {site.address}. Найшвидше — телефон, форма нижче залишає повідомлення
          в цьому прототипі без відправки на пошту.
        </p>
      </header>

      <section className="section split">
        <div className="contact-stack">
          <a className="contact-line" href={site.phoneHref}>
            {site.phones[0]}
          </a>
          <a className="contact-line" href="tel:+380968180001">
            {site.phones[1]}
          </a>
          <a className="contact-line" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <p>
            Заїзд з {site.checkIn}, виїзд до {site.checkOut}.
          </p>
          {sent ? (
            <p className="notice">Дякуємо. У прототипі лист не йде на сервер — лише цей екран.</p>
          ) : (
            <form className="contact-form" onSubmit={submit}>
              <label>
                Ім’я
                <input name="name" required />
              </label>
              <label>
                Телефон або email
                <input name="contact" required />
              </label>
              <label>
                Повідомлення
                <textarea name="message" rows={4} required />
              </label>
              <button className="btn btn-sun" type="submit">
                Написати
              </button>
            </form>
          )}
        </div>
        <iframe
          className="map"
          title="Мапа Мигове"
          src={site.mapEmbed}
          loading="lazy"
        />
      </section>

      <section className="section faq-band">
        <h2>Питання</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  )
}

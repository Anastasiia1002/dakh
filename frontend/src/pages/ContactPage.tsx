import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data/catalog'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-5">
      <p className="kicker text-[0.68rem] text-wood/55">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

const tap = 'block py-1 transition-colors hover:text-clay focus-visible:outline-none focus-visible:text-clay'

const cta =
  'inline-flex w-full items-center justify-center bg-clay px-8 py-3 text-center text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen'

export function ContactPage() {
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const note = {
      name: String(form.get('name') || ''),
      contact: String(form.get('contact') || ''),
      message: String(form.get('message') || ''),
      at: new Date().toISOString(),
    }
    const key = 'dakh-messages'
    const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[]
    localStorage.setItem(key, JSON.stringify([note, ...prev]))
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-32">
      <header className="max-w-2xl">
        <p className="kicker text-[0.68rem] text-clay">Контакти</p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-clay">Як з нами зв’язатися</h1>
      </header>

      <div className="mt-12 grid gap-12 md:grid-cols-2 md:items-stretch md:gap-16">
        <section className="flex flex-col" aria-label="Телефон і пошта">
          <div className="divide-y divide-wood/10">
            <Row label="Телефон">
              <a href={site.phoneHrefs[0]} className={`${tap} font-display text-3xl leading-tight`}>
                {site.phones[0]}
              </a>
              <a href={site.phoneHrefs[1]} className={`${tap} mt-1 font-display text-3xl leading-tight`}>
                {site.phones[1]}
              </a>
            </Row>

            <Row label="Пошта">
              <a href={`mailto:${site.email}`} className={`${tap} text-lg`}>
                {site.email}
              </a>
            </Row>

            <Row label="Готель">
              <p>
                Заїзд з {site.checkIn} · виїзд до {site.checkOut}
              </p>
            </Row>
          </div>

          <Link to="/bronuvannya" className={`${cta} mt-8 md:mt-auto`}>
            Забронювати кімнату
          </Link>
        </section>

        <section className="flex flex-col" aria-label="Адреса і як доїхати">
          <Row label="Адреса">
            <a href={site.map.directions} target="_blank" rel="noreferrer" className={tap}>
              {site.address}
              <br />
              {site.region}
            </a>
          </Row>

          <p className="kicker mt-1 text-[0.68rem] text-wood/55">Як доїхати</p>
          <div className="relative mt-3 min-h-64 flex-1 overflow-hidden border border-wood/10 md:min-h-80">
            <iframe
              title="DAKH, вул. Солонецька, 2-И, с. Мигове"
              src={site.map.embed}
              className="pointer-events-none absolute inset-0 h-full w-full"
              loading="lazy"
            />
            <a
              href={site.map.directions}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0"
              aria-label="Прокласти маршрут до DAKH у Google Maps"
            />
          </div>
          <a href={site.map.directions} target="_blank" rel="noreferrer" className={`${cta} mt-4`}>
            Прокласти маршрут
          </a>
        </section>
      </div>

      {sent ? (
        <p className="mt-20 max-w-2xl bg-beige px-6 py-8 text-sm leading-relaxed">
          Дякуємо. Ми прочитаємо повідомлення й відповімо на вказаний телефон або пошту.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-20 grid gap-6 border-t border-wood/10 pt-16">
          <div className="max-w-2xl">
            <p className="kicker text-[0.68rem] text-clay">Повідомлення</p>
            <h2 className="mt-3 font-display text-4xl text-clay">Напишіть нам</h2>
            <p className="mt-3 text-sm leading-relaxed text-wood/75">
              Ім’я, як з вами зв’язатися і кілька слів — про стіл, кімнату чи просто дорогу.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
              Ім’я
              <input
                name="name"
                autoComplete="name"
                required
                className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
              />
            </label>
            <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
              Телефон або пошта
              <input
                name="contact"
                autoComplete="tel"
                required
                className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
              />
            </label>
          </div>
          <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Що потрібно
            <textarea
              name="message"
              rows={4}
              required
              placeholder="Наприклад: стіл на п’ятьох у суботу або кімната на дві ночі"
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none placeholder:text-wood/35"
            />
          </label>
          <button type="submit" className={`${cta} justify-self-start md:w-auto`}>
            Надіслати
          </button>
        </form>
      )}
    </article>
  )
}

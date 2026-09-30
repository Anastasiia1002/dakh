import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data/catalog'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="kicker text-[0.68rem] text-wood/55">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

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
    <article className="mx-auto grid max-w-6xl gap-16 px-6 pb-24 pt-32 md:grid-cols-2">
      <div>
        <p className="kicker text-[0.68rem] text-clay">Контакти</p>
        <h1 className="mt-3 font-display text-5xl text-clay">Як з нами зв’язатися</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-wood/75">
          Зателефонуйте, напишіть або приїдьте. Стіл зручніше брати по телефону, кімнату —
          заявкою на сайті.
        </p>

        <div className="mt-12 grid gap-9">
          <Field label="Телефон">
            <a href={site.phoneHrefs[0]} className="block font-display text-3xl leading-tight">
              {site.phones[0]}
            </a>
            <a href={site.phoneHrefs[1]} className="mt-2 block font-display text-3xl leading-tight">
              {site.phones[1]}
            </a>
            <p className="mt-2 text-sm text-wood/60">Натисніть номер, щоб подзвонити.</p>
          </Field>

          <Field label="Пошта">
            <a href={`mailto:${site.email}`} className="text-lg">
              {site.email}
            </a>
          </Field>

          <Field label="Адреса">
            <p>
              {site.address}
              <br />
              {site.region}
            </p>
          </Field>

          <Field label="Готель">
            <p>
              Заїзд з {site.checkIn} · виїзд до {site.checkOut}
            </p>
            <Link
              to="/bronuvannya"
              className="mt-3 inline-block text-[0.72rem] font-medium tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
            >
              Забронювати кімнату
            </Link>
          </Field>
        </div>

        <div className="mt-12">
          <p className="kicker text-[0.68rem] text-wood/55">Як доїхати</p>
          <div className="relative mt-3 overflow-hidden border border-wood/10">
            <iframe
              title="DAKH, вул. Солонецька, 2-И, с. Мигове"
              src={site.map.embed}
              className="pointer-events-none h-64 w-full md:h-80"
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
          <a
            href={site.map.directions}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex bg-clay px-8 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen"
          >
            Прокласти маршрут
          </a>
        </div>
      </div>

      {sent ? (
        <p className="self-start bg-beige px-6 py-8 text-sm leading-relaxed">
          Дякуємо. Ми прочитаємо повідомлення й відповімо на вказаний телефон або пошту.
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-6 self-start">
          <div>
            <p className="kicker text-[0.68rem] text-clay">Повідомлення</p>
            <h2 className="mt-3 font-display text-4xl text-clay">Напишіть нам</h2>
            <p className="mt-3 text-sm leading-relaxed text-wood/75">
              Ім’я, як з вами зв’язатися і кілька слів — про стіл, кімнату чи просто дорогу.
            </p>
          </div>
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
          <button
            type="submit"
            className="justify-self-start bg-clay px-8 py-3 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen"
          >
            Надіслати
          </button>
        </form>
      )}
    </article>
  )
}

import { useState, type FormEvent } from 'react'
import { site } from '../data/catalog'

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
        <h1 className="mt-3 font-display text-5xl text-clay">Напишіть або зайдіть</h1>
        <p className="mt-6 text-sm leading-relaxed text-wood/75">
          Стіл у ресторані — телефоном. Кімнату можна залишити заявкою: вона збережеться в
          localStorage.
        </p>
        <a href={site.phoneHref} className="mt-10 block font-display text-3xl">
          {site.phones[0]}
        </a>
        <a href="tel:+380968180001" className="mt-1 block font-display text-2xl">
          {site.phones[1]}
        </a>
        <a href={`mailto:${site.email}`} className="mt-2 block text-lg">
          {site.email}
        </a>
        <p className="mt-6 text-sm">
          {site.address}
          <br />
          Заїзд з {site.checkIn}, виїзд до {site.checkOut}
        </p>
      </div>

      {sent ? (
        <p className="self-start bg-beige px-6 py-8 text-sm">
          Дякуємо. Повідомлення залишилось у браузері — лист на пошту не йде.
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-6 self-start">
          <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Ім’я
            <input
              name="name"
              required
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
            />
          </label>
          <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Телефон або email
            <input
              name="contact"
              required
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
            />
          </label>
          <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
            Повідомлення
            <textarea
              name="message"
              rows={4}
              required
              className="mt-1 w-full border-0 border-b border-wood/25 bg-transparent py-2 outline-none"
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

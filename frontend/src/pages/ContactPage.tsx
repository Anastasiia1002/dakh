import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data/catalog'
import { emailError } from '../lib/email'
import { formatUaMobile, uaMobileError } from '../lib/phone'

type Fields = {
  name: string
  phone: string
  email: string
  message: string
}

type Errors = Partial<Record<keyof Fields, string>>

const emptyFields: Fields = { name: '', phone: '', email: '', message: '' }

function validate(values: Fields): Errors {
  const errors: Errors = {}
  const name = values.name.trim()
  const message = values.message.trim()

  if (!name) errors.name = 'Вкажіть ім’я.'
  else if (name.length < 2) errors.name = 'Ім’я має мати щонайменше дві літери.'
  else if (!/\p{L}/u.test(name)) errors.name = 'Ім’я має містити літери.'

  const phoneError = uaMobileError(values.phone)
  if (phoneError) errors.phone = phoneError

  const mailError = emailError(values.email)
  if (mailError) errors.email = mailError

  if (!message) errors.message = 'Напишіть, про що йдеться.'
  else if (message.length < 8) errors.message = 'Трохи більше деталей — хоча б кілька слів.'

  return errors
}

function fieldClass(error?: string) {
  return [
    'mt-1 w-full border-0 border-b bg-transparent py-2 outline-none placeholder:text-wood/35',
    error ? 'border-clay' : 'border-wood/25',
  ].join(' ')
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-5">
      <p className="kicker text-[0.68rem] text-wood/55">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="text-[0.7rem] tracking-[0.12em] uppercase text-wood/60">
      {label}
      {required ? <span aria-hidden="true"> *</span> : null}
      {children}
      {error ? (
        <span className="mt-2 block text-sm font-normal normal-case tracking-normal text-clay" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

const tap = 'block py-1 transition-colors hover:text-clay focus-visible:outline-none focus-visible:text-clay'

const cta =
  'inline-flex w-full items-center justify-center bg-clay px-8 py-3 text-center text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen'

export function ContactPage() {
  const [sent, setSent] = useState(false)
  const [values, setValues] = useState<Fields>(emptyFields)
  const [errors, setErrors] = useState<Errors>({})
  const [attempted, setAttempted] = useState(false)
  const [phoneChecked, setPhoneChecked] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)

  function update<Key extends keyof Fields>(key: Key, value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value }
      if (attempted || (key === 'phone' && phoneChecked) || (key === 'email' && emailChecked)) {
        setErrors(validate(next))
      }
      return next
    })
  }

  function checkPhone() {
    const formatted = formatUaMobile(values.phone)
    setPhoneChecked(true)
    if (formatted) {
      setValues((current) => ({ ...current, phone: formatted }))
      setErrors((current) => {
        const next = validate({ ...values, phone: formatted })
        return attempted ? next : { ...current, phone: undefined }
      })
      return
    }
    const phoneError = uaMobileError(values.phone)
    if (phoneError && (values.phone.trim() || attempted)) {
      setErrors((current) => ({ ...current, phone: phoneError }))
    }
  }

  function checkEmail() {
    const trimmed = values.email.trim()
    setEmailChecked(true)
    if (trimmed !== values.email) {
      setValues((current) => ({ ...current, email: trimmed }))
    }
    const mailError = emailError(trimmed)
    if (mailError && (trimmed || attempted)) {
      setErrors((current) => ({ ...current, email: mailError }))
      return
    }
    setErrors((current) => {
      const next = validate({ ...values, email: trimmed })
      return attempted ? next : { ...current, email: undefined }
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setAttempted(true)
    setErrors(nextErrors)
    const first = (['name', 'phone', 'email', 'message'] as const).find((key) => nextErrors[key])
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    const note = {
      name: values.name.trim(),
      phone: formatUaMobile(values.phone) || values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      message: values.message.trim(),
      at: new Date().toISOString(),
    }
    const key = 'dakh-messages'
    const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[]
    localStorage.setItem(key, JSON.stringify([note, ...prev]))
    setSent(true)
    setValues(emptyFields)
    setErrors({})
    setAttempted(false)
    setPhoneChecked(false)
    setEmailChecked(false)
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
        <form noValidate onSubmit={submit} className="mt-20 grid gap-6 border-t border-wood/10 pt-16">
          <div className="max-w-2xl">
            <p className="kicker text-[0.68rem] text-clay">Повідомлення</p>
            <h2 className="mt-3 font-display text-4xl text-clay">Напишіть нам</h2>
            <p className="mt-3 text-sm leading-relaxed text-wood/75">
              Ім’я, телефон і пошта обов’язкові. Далі кілька слів — про стіл, кімнату чи просто дорогу.
            </p>
          </div>
          <FormField label="Ім’я" required error={errors.name}>
            <input
              name="name"
              autoComplete="name"
              required
              aria-required="true"
              value={values.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => update('name', event.target.value)}
              className={fieldClass(errors.name)}
            />
          </FormField>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Телефон" required error={errors.phone}>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                aria-required="true"
                placeholder="+38 (095) 818-00-01"
                value={values.phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(event) => update('phone', event.target.value)}
                onBlur={checkPhone}
                className={fieldClass(errors.phone)}
              />
            </FormField>
            <FormField label="Пошта" required error={errors.email}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                placeholder="name@email.com"
                value={values.email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => update('email', event.target.value)}
                onBlur={checkEmail}
                className={fieldClass(errors.email)}
              />
            </FormField>
          </div>
          <FormField label="Що потрібно" error={errors.message}>
            <textarea
              name="message"
              rows={4}
              placeholder="Наприклад: стіл на п’ятьох у суботу або кімната на дві ночі"
              value={values.message}
              aria-invalid={Boolean(errors.message)}
              onChange={(event) => update('message', event.target.value)}
              className={fieldClass(errors.message)}
            />
          </FormField>
          <button type="submit" className={`${cta} justify-self-start md:w-auto`}>
            Надіслати
          </button>
        </form>
      )}
    </article>
  )
}

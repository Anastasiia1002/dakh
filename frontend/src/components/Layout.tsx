import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { site } from '../data/catalog'
import { DakhLogo } from './BrandMarks'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

const nav = [
  { to: '/rooms', label: 'Кімнати' },
  { to: '/houses', label: 'Будинки' },
  { to: '/menu', label: 'Ресторан' },
  { to: '/pro-nas', label: 'Про нас' },
  { to: '/kontakty', label: 'Контакти' },
]

const headerAction =
  'inline-flex items-center justify-center px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase md:px-5 md:text-[0.72rem]'

function HeaderActions({
  className = '',
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a
        href={site.phoneHrefs[0]}
        className={`${headerAction} border border-current`}
        aria-label={`Подзвонити ${site.phones[0]}`}
      >
        Подзвонити
      </a>
      {bookingEnabled ? (
        <Link to="/bronuvannya" onClick={onNavigate} className={`${headerAction} bg-clay text-linen`}>
          Забронювати
        </Link>
      ) : null}
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function Layout() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const overHero = pathname === '/' || pathname === '/menu'
  const tone = overHero ? 'linen' : 'wood'

  return (
    <div className="min-h-screen bg-linen text-wood">
      <ScrollToTop />
      <header
        className={
          overHero
            ? 'absolute inset-x-0 top-0 z-30 text-linen'
            : 'sticky top-0 z-30 border-b border-wood/10 bg-linen/95 text-wood'
        }
      >
        {bookingEnabled ? (
          <p className="bg-clay px-4 py-2 text-center text-[0.78rem] font-semibold leading-5 text-linen" role="status">
            Тестовий режим. 2 000 ₴ за ніч — демонстраційна ціна, не комерційна. Оплата не стягується.
          </p>
        ) : null}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-5 md:gap-6">
          <DakhLogo tone={tone} compact />
          <nav className="hidden items-center gap-8 text-[0.72rem] font-medium tracking-[0.16em] uppercase md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `border-b ${isActive ? 'border-current' : 'border-transparent hover:border-current/40'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={site.phoneHrefs[0]}
              className={`${headerAction} border border-current md:hidden`}
              aria-label={`Подзвонити ${site.phones[0]}`}
            >
              Подзвонити
            </a>
            <HeaderActions className="hidden md:flex" />
            <button
              type="button"
              className="md:hidden"
              aria-expanded={open}
              aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="block h-px w-6 bg-current" />
              <span className="mt-2 block h-px w-6 bg-current" />
            </button>
          </div>
        </div>
        {open ? (
          <div className="mx-6 border border-wood/10 bg-linen px-6 py-6 text-wood md:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm tracking-[0.12em] uppercase"
              >
                {item.label}
              </NavLink>
            ))}
            <HeaderActions className="mt-4" onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="relative mt-24 overflow-hidden border-t border-wood/10 bg-beige">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
          <div>
            <DakhLogo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-wood/80">
              Готель і ресторан DAKH у Мигові. Тут не треба поспішати.
            </p>
          </div>
          <div className="text-sm">
            <p className="kicker mb-3 text-[0.68rem] text-wood/55">Навігація</p>
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className="block py-1">
                {item.label}
              </Link>
            ))}
            {bookingEnabled ? (
              <Link to="/bronuvannya" className="block py-1">
                Бронювання
              </Link>
            ) : null}
          </div>
          <div className="text-sm">
            <p className="kicker mb-3 text-[0.68rem] text-wood/55">Контакти</p>
            <p className="text-[0.68rem] text-wood/55">Телефон</p>
            <a href={site.phoneHrefs[0]} className="block py-1">
              {site.phones[0]}
            </a>
            <a href={site.phoneHrefs[1]} className="block py-1">
              {site.phones[1]}
            </a>
            <p className="mt-3 text-[0.68rem] text-wood/55">Пошта</p>
            <a href={`mailto:${site.email}`} className="block py-1">
              {site.email}
            </a>
            <p className="mt-3 text-[0.68rem] text-wood/55">Адреса</p>
            <a href={site.map.directions} target="_blank" rel="noreferrer" className="mt-1 block py-1">
              {site.address}
              <br />
              {site.region}
            </a>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl justify-between gap-4 border-t border-wood/10 px-6 py-5 text-[0.72rem] text-wood/55">
          <span>© {new Date().getFullYear()} DAKH. Усі права захищені.</span>
          <span>
            Заїзд {site.checkIn} · виїзд {site.checkOut}
          </span>
        </div>
      </footer>
    </div>
  )
}

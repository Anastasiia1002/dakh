import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { site } from '../data/catalog'
import { DakhLogo, SunnyParkLogo } from './BrandMarks'

const nav = [
  { to: '/gotel', label: 'Готель' },
  { to: '/restoran', label: 'DAKH' },
  { to: '/menu', label: 'Меню' },
  { to: '/pro-nas', label: 'Про нас' },
  { to: '/kontakty', label: 'Контакти' },
]

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
  const restaurant = pathname === '/restoran' || pathname === '/menu'
  const overHero =
    pathname === '/' || restaurant || /^\/gotel\/[^/]+$/.test(pathname)
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          {restaurant ? <DakhLogo tone={tone} compact /> : <SunnyParkLogo tone={tone} compact />}
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
          <Link
            to="/bronuvannya"
            className="hidden bg-clay px-5 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-linen md:inline-flex"
          >
            Забронювати
          </Link>
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
            <Link
              to="/bronuvannya"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex bg-clay px-5 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-linen"
            >
              Забронювати
            </Link>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="relative mt-24 overflow-hidden border-t border-wood/10 bg-beige">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
          <div className="flex flex-col gap-8">
            <SunnyParkLogo />
            <DakhLogo />
            <p className="max-w-xs text-sm leading-relaxed text-wood/80">
              Готель Sunny Park і ресторан DAKH — одна екосистема в Мигові. Тут не треба
              поспішати.
            </p>
          </div>
          <div className="text-sm">
            <p className="kicker mb-3 text-[0.68rem] text-wood/55">Навігація</p>
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className="block py-1">
                {item.label}
              </Link>
            ))}
            <Link to="/bronuvannya" className="block py-1">
              Бронювання кімнати
            </Link>
          </div>
          <div className="text-sm">
            <p className="kicker mb-3 text-[0.68rem] text-wood/55">Контакти</p>
            <a href={site.phoneHref} className="block py-1">
              {site.phones[0]}
            </a>
            <a href="tel:+380968180001" className="block py-1">
              {site.phones[1]}
            </a>
            <a href={`mailto:${site.email}`} className="block py-1">
              {site.email}
            </a>
            <p className="mt-3">
              {site.address}
              <br />
              {site.region}
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl justify-between gap-4 border-t border-wood/10 px-6 py-5 text-[0.72rem] text-wood/55">
          <span>Заявки кімнат — у localStorage цього браузера. Стіл у DAKH — телефоном.</span>
          <span>
            Заїзд {site.checkIn} · виїзд {site.checkOut}
          </span>
        </div>
      </footer>
    </div>
  )
}

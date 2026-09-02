import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { site } from '../data/catalog'

const nav = [
  { to: '/prozhivannya', label: 'Проживання' },
  { to: '/spa', label: 'SPA' },
  { to: '/restoran', label: 'Ресторан' },
  { to: '/bronuvannya', label: 'Бронювання' },
  { to: '/kontakty', label: 'Контакти' },
]

function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Sunny Park, на головну">
      <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="15" r="7" />
        <path d="M6 34 L24 20 L42 34 V40 H6 Z" />
      </svg>
      <span>
        <strong>Sunny Park</strong>
        <em>{site.place}</em>
      </span>
    </Link>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function TopNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className={open ? 'nav is-open' : 'nav'} aria-label="Головна навігація">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <a className="topbar-phone" href={site.phoneHref}>
        {site.phones[0]}
      </a>
      <button
        className="menu-btn"
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
    </>
  )
}

export function Layout() {
  return (
    <div className="shell">
      <ScrollToTop />
      <header className="topbar">
        <Logo />
        <TopNav />
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <Logo />
            <p>
              Готельний комплекс у Мигові: номери, таунхауси, SPA і кухня
              Карпат. Понад {site.hectares} гектари хвої, води й даху над
              головою.
            </p>
          </div>
          <div>
            <p className="eyebrow">Навігація</p>
            {nav.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="eyebrow">Контакти</p>
            <a href={site.phoneHref}>{site.phones[0]}</a>
            <a href={`tel:+380968180001`}>{site.phones[1]}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <p>
              {site.address}
              <br />
              {site.region}
            </p>
          </div>
        </div>
        <div className="footer-bar">
          <span>Прототип фронтенду dakh · дані з каталогу, без онлайн-оплати</span>
          <span>Заїзд {site.checkIn} · виїзд {site.checkOut}</span>
        </div>
      </footer>
    </div>
  )
}

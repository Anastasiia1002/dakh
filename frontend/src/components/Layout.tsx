import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { site } from '../data/catalog'
import { DocumentHead } from './DocumentHead'
import { DakhLogo } from './BrandMarks'
import { QuickActions } from './QuickActions'
import { normalizePublicPath } from '../lib/seo'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

const headerNav = [
  { to: '/rooms', label: 'Кімнати' },
  { to: '/houses', label: 'Будинки' },
  { to: '/menu', label: 'Ресторан' },
  { to: '/pro-nas', label: 'Про нас' },
  { to: '/kontakty', label: 'Контакти' },
]

const footerNav = [...headerNav, { to: '/moie-bronyuvannya', label: 'Моє бронювання' }]

const headerAction =
  'inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase md:px-5 md:text-[0.72rem]'

function HeaderActions({
  className = '',
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={site.phoneHrefs[0]}
        className={`${headerAction} border border-current`}
        aria-label={`Подзвонити ${site.phones[0]}`}
      >
        Подзвонити
      </a>
      {bookingEnabled ? (
        <Link to="/bronuvannya" onClick={onNavigate} className={`${headerAction} bg-clay text-linen lg:hidden`}>
          Забронювати
        </Link>
      ) : null}
    </div>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  const bar = 'absolute left-0 h-0.5 w-5 bg-current transition duration-200'
  return (
    <span className="relative block h-4 w-5" aria-hidden="true">
      <span className={`${bar} ${open ? 'top-[7px] rotate-45' : 'top-0'}`} />
      <span className={`${bar} top-[7px] ${open ? 'opacity-0' : 'opacity-100'}`} />
      <span className={`${bar} ${open ? 'top-[7px] -rotate-45' : 'top-[14px]'}`} />
    </span>
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
  const [menuPath, setMenuPath] = useState(pathname)
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(false)
  }
  const path = normalizePublicPath(pathname)
  const overHero =
    path === '/' ||
    path === '/menu' ||
    path === '/rooms' ||
    path === '/houses' ||
    path === '/pro-nas' ||
    path === '/bronuvannya' ||
    path.startsWith('/rooms/') ||
    path.startsWith('/houses/')
  const tone = overHero ? 'linen' : 'wood'

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButtonRef.current?.focus()
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return
      setOpen(false)
    }
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  return (
    <div className="min-h-screen bg-linen text-wood">
      <DocumentHead />
      <ScrollToTop />
      <header
        className={
          overHero
            ? `absolute inset-x-0 top-0 text-linen ${open ? 'z-[60]' : 'z-30'}`
            : `sticky top-0 border-b border-wood/10 bg-linen/95 text-wood ${open ? 'z-[60]' : 'z-30'}`
        }
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 lg:gap-5">
          <DakhLogo tone={tone} compact />
          <nav className="hidden min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-[0.68rem] font-medium tracking-[0.12em] uppercase lg:flex xl:gap-x-6 xl:text-[0.72rem] xl:tracking-[0.14em]">
            {headerNav.map((item) => (
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
            <HeaderActions className="hidden lg:flex" />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-haspopup="true"
              aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
              onClick={() => setOpen((value) => !value)}
            >
              <MenuIcon open={open} />
            </button>
          </div>
        </div>
        {open ? (
          <div
            id="site-menu"
            ref={menuRef}
            className="relative z-[60] mx-4 mb-4 overflow-hidden border border-wood/10 bg-linen px-5 py-4 text-wood shadow-[0_16px_40px_rgba(91,56,43,0.16)] sm:mx-6 lg:hidden"
          >
            {headerNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center py-2 text-sm tracking-[0.12em] uppercase"
              >
                {item.label}
              </NavLink>
            ))}
            <HeaderActions className="mt-4" onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </header>

      <main>
        <Suspense fallback={<p className="px-6 pt-32 text-sm text-wood/60">Завантажуємо сторінку…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <QuickActions />

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
            {footerNav.map((item) => (
              <Link key={item.to} to={item.to} className="block min-h-11 py-2 sm:min-h-0 sm:py-1">
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
            <a href={site.map.place} target="_blank" rel="noreferrer" className="mt-1 block py-1">
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

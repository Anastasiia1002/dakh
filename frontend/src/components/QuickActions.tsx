import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { site } from '../data/catalog'
import { officialSocials } from '../lib/siteSocials'
import { normalizePublicPath } from '../lib/seo'
import { stayUrlFromSearch, withStayUrl } from '../lib/publicBooking/stayUrl'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

function hideQuickActions(pathname: string) {
  const path = normalizePublicPath(pathname)
  return (
    path === '/bronuvannya' ||
    path.startsWith('/bronuvannya/') ||
    path === '/moie-bronyuvannya' ||
    path === '/my-booking'
  )
}

const actionClass =
  'pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-wood/15 bg-linen/95 px-3 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-wood shadow-[0_10px_28px_rgba(91,56,43,0.16)] backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

export function QuickActions() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const stay = stayUrlFromSearch(params)
  const socials = officialSocials()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  if (hideQuickActions(pathname)) return null

  const bookTo = withStayUrl('/bronuvannya', stay)

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed right-3 bottom-[max(0.85rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-2 sm:right-5"
    >
      {open && socials.length > 0 ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Офіційні сторінки DAKH"
          className="pointer-events-auto min-w-44 border border-wood/15 bg-linen px-2 py-2 shadow-[0_12px_32px_rgba(91,56,43,0.18)]"
        >
          {socials.map((item) => (
            <a
              key={item.href}
              role="menuitem"
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center px-3 text-sm text-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              {item.label}
            </a>
          ))}
        </div>
      ) : null}
      {socials.length > 0 ? (
        <button
          type="button"
          className={actionClass}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          Соцмережі
        </button>
      ) : null}
      {bookingEnabled ? (
        <Link to={bookTo} className={`${actionClass} bg-clay text-linen border-clay`}>
          Забронювати
        </Link>
      ) : null}
      <a href={site.phoneHrefs[0]} className={actionClass} aria-label={`Подзвонити ${site.phones[0]}`}>
        Подзвонити
      </a>
    </div>
  )
}

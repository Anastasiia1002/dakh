import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
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
    path.startsWith('/rooms/') ||
    path.startsWith('/houses/') ||
    path === '/moie-bronyuvannya' ||
    path === '/my-booking'
  )
}

const socialClass =
  'pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-wood/15 bg-linen/95 px-3 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-wood shadow-[0_10px_28px_rgba(91,56,43,0.16)] backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

const iconActionClass =
  'group pointer-events-auto relative inline-flex size-11 items-center justify-center border shadow-[0_10px_28px_rgba(91,56,43,0.16)] backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

function ActionTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute top-1/2 right-full z-10 mr-2 -translate-y-1/2 whitespace-nowrap border border-wood/15 bg-linen px-2 py-1 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-wood opacity-0 shadow-[0_10px_28px_rgba(91,56,43,0.16)] transition-opacity group-hover:opacity-100 group-focus:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  )
}

function CalendarDays({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 2v4M16 2v4" strokeLinecap="round" strokeLinejoin="round" />
      <rect width="18" height="18" x="3" y="4" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Phone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A19.79 19.79 0 0 1 1 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconAction({
  label,
  className,
  href,
  to,
  children,
}: {
  label: string
  className: string
  href?: string
  to?: string
  children: ReactNode
}) {
  const content = (
    <>
      {children}
      <ActionTooltip label={label} />
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className} aria-label={label}>
        {content}
      </Link>
    )
  }
  return (
    <a href={href} className={className} aria-label={label}>
      {content}
    </a>
  )
}

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
          className={socialClass}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          Соцмережі
        </button>
      ) : null}
      <div className="pointer-events-none flex flex-col items-end gap-2">
        {bookingEnabled ? (
          <IconAction label="Забронювати" to={bookTo} className={`${iconActionClass} border-clay bg-clay text-linen`}>
            <CalendarDays className="size-6" />
          </IconAction>
        ) : null}
        <IconAction label="Подзвонити" href={site.phoneHrefs[0]} className={`${iconActionClass} border-wood/15 bg-linen/95 text-wood`}>
          <Phone className="size-6" />
        </IconAction>
      </div>
    </div>
  )
}

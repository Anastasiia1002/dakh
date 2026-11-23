import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { widgetContactChannels, type ContactChannel } from '../lib/contactChannels'
import { normalizePublicPath } from '../lib/seo'
import { stayUrlFromSearch, withStayUrl } from '../lib/publicBooking/stayUrl'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

function hideQuickActions(pathname: string) {
  const path = normalizePublicPath(pathname)
  return (
    path === '/bronuvannya' ||
    path.startsWith('/bronuvannya/') ||
    path === '/kontakty' ||
    path === '/moie-bronyuvannya' ||
    path === '/my-booking'
  )
}

function stayDetailPath(pathname: string) {
  const path = normalizePublicPath(pathname)
  return path.startsWith('/rooms/') || path.startsWith('/houses/')
}

const fabClass =
  'group pointer-events-auto relative inline-flex size-[52px] items-center justify-center rounded-full bg-wood text-linen shadow-[0_10px_28px_rgba(91,56,43,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

function useFineHover() {
  const [fineHover, setFineHover] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFineHover(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return fineHover
}

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

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        d="M7 8h10M7 12h6M5 19.5V6.2A2.2 2.2 0 0 1 7.2 4h9.6A2.2 2.2 0 0 1 19 6.2v7.6A2.2 2.2 0 0 1 16.8 16H8.5L5 19.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.55L4 20l.95-4.1A8.5 8.5 0 1 1 20.5 11.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.2 9.6c.2-.5.3-.5.6-.5h.5c.2 0 .3.1.4.3l.5 1.2c.1.2 0 .4-.1.5l-.4.4c-.1.1-.1.3 0 .5.4.7 1.1 1.4 1.8 1.8.2.1.4.1.5 0l.4-.4c.2-.1.4-.2.5-.1l1.2.5c.2.1.3.2.3.4v.5c0 .3 0 .4-.5.6-.5.2-1.3.1-2.7-.5-1.5-.7-2.6-1.8-3.3-3.3-.6-1.3-.7-2.1-.5-2.6Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        d="M7 19.5V16A7.5 7.5 0 1 1 17 16v3.5L14.2 18H12A7.5 7.5 0 0 1 7 19.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 9.5c.8 2 2 3.2 4 4" strokeLinecap="round" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChannelIcon({ id, className }: { id: string; className?: string }) {
  if (id === 'whatsapp') return <WhatsAppIcon className={className} />
  if (id === 'viber') return <ViberIcon className={className} />
  if (id === 'instagram') return <InstagramIcon className={className} />
  if (id === 'telegram') return <ChatIcon className={className} />
  return <PhoneIcon className={className} />
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

function ChannelButton({ channel, onSelect }: { channel: ContactChannel; onSelect: () => void }) {
  return (
    <a
      role="menuitem"
      href={channel.href}
      target={channel.external ? '_blank' : undefined}
      rel={channel.external ? 'noreferrer' : undefined}
      className={fabClass}
      aria-label={channel.label}
      onClick={onSelect}
    >
      <ChannelIcon id={channel.id} className="size-6" />
      <ActionTooltip label={channel.label} />
    </a>
  )
}

export function QuickActions() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const stay = stayUrlFromSearch(params)
  const channels = widgetContactChannels()
  const fineHover = useFineHover()
  const [hoverOpen, setHoverOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [tapOpen, setTapOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const open = tapOpen || hoverOpen || focusOpen

  function closeMenu() {
    setHoverOpen(false)
    setFocusOpen(false)
    setTapOpen(false)
    queueMicrotask(() => buttonRef.current?.focus())
  }

  useEffect(() => {
    setHoverOpen(false)
    setFocusOpen(false)
    setTapOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeMenu()
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (contactRef.current?.contains(target)) return
      setTapOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  if (hideQuickActions(pathname)) return null

  const stayDetail = stayDetailPath(pathname)
  const bookTo = withStayUrl('/bronuvannya', stay)
  const bottomClass =
    stayDetail && bookingEnabled
      ? 'bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.4rem))] lg:bottom-[max(0.85rem,env(safe-area-inset-bottom))]'
      : 'bottom-[max(0.85rem,env(safe-area-inset-bottom))]'

  return (
    <div
      className={`pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] ${bottomClass} z-40 flex max-w-[calc(100vw-1.5rem-env(safe-area-inset-left)-env(safe-area-inset-right))] flex-col items-end gap-3`}
    >
      <div
        ref={contactRef}
        className="pointer-events-auto relative flex flex-col items-end gap-3"
        onPointerEnter={() => {
          if (fineHover) setHoverOpen(true)
        }}
        onPointerLeave={() => {
          setHoverOpen(false)
          if (fineHover) setTapOpen(false)
        }}
        onFocusCapture={() => setFocusOpen(true)}
        onBlurCapture={(event) => {
          const next = event.relatedTarget
          if (next instanceof Node && contactRef.current?.contains(next)) return
          setFocusOpen(false)
        }}
      >
        <div
          id={menuId}
          role="menu"
          aria-label="Зв’язатися з DAKH"
          aria-hidden={!open}
          inert={!open}
          className={`flex flex-col items-end gap-3 motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-reduce:transition-none ${
            open ? 'translate-y-0 opacity-100' : 'pointer-events-none hidden translate-y-1.5 opacity-0'
          }`}
        >
          {channels.map((channel) => (
            <ChannelButton key={channel.id} channel={channel} onSelect={() => setTapOpen(false)} />
          ))}
        </div>
        <button
          ref={buttonRef}
          type="button"
          className={fabClass}
          aria-label={open ? 'Закрити контакти' : 'Зв’язатися'}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={() => {
            setTapOpen((current) => !current)
          }}
        >
          {open ? <CloseIcon className="size-6" /> : <ChatIcon className="size-6" />}
          {open ? null : <ActionTooltip label="Зв’язатися" />}
        </button>
      </div>
      {bookingEnabled && !stayDetail ? (
        <IconAction label="Забронювати" to={bookTo} className={fabClass}>
          <CalendarDays className="size-6" />
        </IconAction>
      ) : null}
    </div>
  )
}

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

const bookActionClass =
  'group pointer-events-auto relative inline-flex size-11 items-center justify-center border border-clay bg-clay text-linen shadow-[0_10px_28px_rgba(91,56,43,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay'

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
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.45 1.33 4.95L2 22l5.37-1.4a10 10 0 0 0 4.67 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.19.83.85-3.1-.2-.32a8.14 8.14 0 0 1-1.26-4.37c0-4.5 3.69-8.16 8.23-8.16 4.39 0 8.22 3.54 8.22 8.16 0 4.5-3.69 8.29-8.16 8.29Zm4.51-6.2c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.24 3.74 1.49.64 2.08.7 2.82.59.43-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11.4 2.1c-4.7.3-8.6 4.1-9 8.8-.3 3.5 1.3 6.8 4.1 8.7v2.3l2.2-1.2c.8.2 1.6.3 2.4.3h.3c5.2-.2 9.2-4.6 8.9-9.8-.3-4.8-4.4-8.6-8.9-9.1Zm4.7 13.1c-.2.5-.8 1-1.3 1.1-.4.1-1 .2-3-.8-2.4-1.2-4-3.6-4.1-3.8-.2-.2-1.3-1.7-1.3-3.3 0-1.6.8-2.3 1.1-2.6.3-.3.7-.4.9-.4h.7c.2 0 .5 0 .7.6.3.8.9 2.8 1 3 .1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.5.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.9 1 2.2 1.1.3.2.5.2.6.4.1.1.1.7-.2 1.2Z" />
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

function ChannelLink({ channel, onSelect }: { channel: ContactChannel; onSelect: () => void }) {
  return (
    <a
      role="menuitem"
      href={channel.href}
      target={channel.external ? '_blank' : undefined}
      rel={channel.external ? 'noreferrer' : undefined}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-wood transition-colors hover:bg-wood/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      onClick={onSelect}
    >
      <ChannelIcon id={channel.id} className="size-[22px] shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm leading-5">{channel.label}</span>
        {channel.detail ? <span className="mt-0.5 block text-xs leading-4 text-wood/60">{channel.detail}</span> : null}
      </span>
    </a>
  )
}

export function QuickActions() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const stay = stayUrlFromSearch(params)
  const channels = widgetContactChannels()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const headingId = useId()

  function closeMenu() {
    setOpen(false)
    queueMicrotask(() => buttonRef.current?.focus())
  }

  useEffect(() => {
    setOpen(false)
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
      if (rootRef.current?.contains(target)) return
      closeMenu()
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
      ref={rootRef}
      className={`pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] ${bottomClass} z-40 flex max-w-[calc(100vw-1.5rem-env(safe-area-inset-left)-env(safe-area-inset-right))] flex-col items-end gap-2`}
    >
      <div
        id={menuId}
        role="menu"
        aria-labelledby={headingId}
        aria-hidden={!open}
        className={`w-[min(17.5rem,calc(100vw-1.5rem))] origin-bottom-right rounded-2xl border border-wood/12 bg-linen p-2 text-wood shadow-[0_12px_32px_rgba(91,56,43,0.18)] motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-reduce:transition-none ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none invisible translate-y-1.5 opacity-0'
        }`}
      >
        <p id={headingId} className="px-3 pb-1 pt-1.5 text-sm font-medium">
          Зв’язатися з DAKH
        </p>
        {channels.map((channel) => (
          <ChannelLink key={channel.id} channel={channel} onSelect={closeMenu} />
        ))}
      </div>
      <div className="pointer-events-none flex items-end gap-2">
        {bookingEnabled && !stayDetail ? (
          <IconAction label="Забронювати" to={bookTo} className={bookActionClass}>
            <CalendarDays className="size-6" />
          </IconAction>
        ) : null}
        <button
          ref={buttonRef}
          type="button"
          className="group pointer-events-auto relative inline-flex size-[52px] items-center justify-center rounded-full bg-wood text-linen shadow-[0_10px_28px_rgba(91,56,43,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          aria-label={open ? 'Закрити контакти' : 'Зв’язатися'}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={() => (open ? closeMenu() : setOpen(true))}
        >
          {open ? <CloseIcon className="size-6" /> : <ChatIcon className="size-6" />}
          {open ? null : <ActionTooltip label="Зв’язатися" />}
        </button>
      </div>
    </div>
  )
}

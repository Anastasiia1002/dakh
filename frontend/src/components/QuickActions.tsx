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
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11.4.028C9.4.053 5.332.688 3.045 3.04 1.274 4.912.3 7.387.273 9.886c-.06 4.85.78 8.42 2.96 10.543V22.8l2.59-1.41c.94.26 1.86.42 2.86.46h.34c6.1-.18 10.82-4.5 10.5-10.57C19.23 5.48 16.1.5 11.4.028Zm5.54 15.42c-.23.6-.96 1.12-1.57 1.27-.5.13-1.15.23-3.54-.93-2.82-1.37-4.63-4.2-4.77-4.4-.13-.2-1.5-2-1.5-3.82 0-1.8.95-2.68 1.29-3.04.33-.35.82-.44 1.1-.44h.8c.26 0 .61 0 .83.7.34.95 1.07 3.3 1.16 3.54.1.24.16.52 0 .73-.16.2-.24.33-.47.56-.23.23-.48.51-.68.69-.22.2-.45.42-.2.73.24.3.96 1.58 2.06 2.56 1.41 1.26 2.6 1.65 2.97 1.84.37.18.58.15.8-.1.21-.24.92-1.07 1.17-1.44.24-.37.49-.3.82-.18.34.13 2.15 1.02 2.52 1.2.37.19.61.28.7.44.08.16.08.9-.27 1.5Z" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M21.54 2.48c.54-.22 1.1.32.9.87L18.2 20.7c-.18.5-.74.7-1.2.44l-5.02-2.86-2.72 2.6c-.45.43-1.2.12-1.2-.5v-3.73L2.7 14.4c-.55-.22-.58-1-.05-1.26L21.54 2.48Zm-4.3 4.04-9.6 5.86 8.04 2.3 1.56-8.16Z" />
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
  if (id === 'telegram') return <TelegramIcon className={className} />
  if (id === 'instagram') return <InstagramIcon className={className} />
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

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  canUseAsCheckIn,
  canUseAsCheckOut,
  guestCountOf,
} from '../lib/publicBooking'
import {
  canFinishCheckOut,
  canStartCheckIn,
  dayAriaLabel,
  dayStatusCopy,
  dayVisual,
  visibleCalendarRange,
  type CalendarLoadStatus,
  type DayVisual,
} from '../lib/publicBooking/calendar'
import { calendarUsesTwoMonths } from '../lib/publicBooking/roomIdentity'
import { MAX_GUESTS } from '../lib/publicBooking/types'
import type { PublicCalendarDay } from '../lib/publicBooking/types'
import {
  addMonths,
  formatDate,
  formatDayMonth,
  formatMonthTitle,
  monthCells,
  todayIso,
  weekdaysMon,
} from '../lib/format'

type Panel = 'dates' | 'guests' | null

type Props = {
  checkIn: string
  checkOut: string
  adults: number
  kids: number
  nightPrices?: Record<string, string>
  loading?: boolean
  readOnly?: boolean
  live?: {
    status: CalendarLoadStatus
    hotelToday: string | null
    days: Record<string, PublicCalendarDay>
    error?: string
    capacityNote?: string
  }
  onVisibleRange?: (range: { from: string; to: string }) => void
  /** Room-page card anchors the popover to its right edge so it can grow left. */
  align?: 'start' | 'end'
  onChange: (next: {
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
  }) => void
}

export function BookingCalendar({
  checkIn,
  checkOut,
  adults,
  kids,
  loading = false,
  readOnly = false,
  live,
  onVisibleRange,
  align = 'start',
  onChange,
}: Props) {
  const now = new Date()
  const root = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [place, setPlace] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const [hover, setHover] = useState('')
  const [cursor, setCursor] = useState(() => ({
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  }))

  const pickingOut = Boolean(checkIn && !checkOut)
  const previewOut = pickingOut ? hover : ''
  const guestTotal = guestCountOf(adults, kids)

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setPanel(null)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setPanel(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const months = [cursor, addMonths(cursor.year, cursor.monthIndex, 1)]
  const canGoBack =
    cursor.year > now.getFullYear() ||
    (cursor.year === now.getFullYear() && cursor.monthIndex > now.getMonth())

  useEffect(() => {
    onVisibleRange?.(visibleCalendarRange(cursor.year, cursor.monthIndex))
  }, [cursor, onVisibleRange])

  useLayoutEffect(() => {
    if (panel !== 'dates') return
    function updatePlace() {
      const el = root.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const margin = 12
      const vw = window.innerWidth
      const maxWidth = Math.max(280, vw - margin * 2)
      // Two months need ~800px. A narrow room card cannot hold that, so the
      // popover grows left from the card and stays inside the viewport.
      const preferWide = align === 'end' && vw >= 768
      const preferred = preferWide
        ? Math.min(800, maxWidth)
        : Math.min(Math.max(rect.width, vw < 768 ? 360 : 280), maxWidth)
      let width = preferred
      let left = align === 'end' ? rect.right - width : rect.left
      if (left + width > vw - margin) left = vw - margin - width
      if (left < margin) left = margin
      width = Math.min(width, vw - margin - left)
      const vh = window.innerHeight
      const ideal = Math.min(620, vh - margin * 2)
      const below = vh - rect.bottom - margin
      const above = rect.top - margin
      let top
      let maxHeight
      if (below >= Math.min(ideal, 480)) {
        maxHeight = Math.min(ideal, below)
        top = rect.bottom + margin
      } else if (above >= Math.min(ideal, 480)) {
        maxHeight = Math.min(ideal, above)
        top = Math.max(margin, rect.top - margin - maxHeight)
      } else {
        maxHeight = ideal
        top = Math.min(Math.max(margin, rect.bottom + margin), vh - margin - maxHeight)
      }
      const next = {
        top: Math.round(top),
        left: Math.round(left),
        width: Math.round(width),
        maxHeight: Math.round(maxHeight),
      }
      setPlace((current) =>
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width &&
        current.maxHeight === next.maxHeight
          ? current
          : next,
      )
    }
    updatePlace()
    window.addEventListener('resize', updatePlace)
    window.addEventListener('scroll', updatePlace, true)
    return () => {
      window.removeEventListener('resize', updatePlace)
      window.removeEventListener('scroll', updatePlace, true)
    }
  }, [panel, align])

  const dateLabel =
    checkIn && checkOut
      ? `${formatDayMonth(checkIn)} — ${formatDayMonth(checkOut)}`
      : checkIn
        ? `${formatDayMonth(checkIn)} — Дата виїзду`
        : 'Дата заїзду — Дата виїзду'

  const guestLabel = `${adults} ${adults === 1 ? 'дорослий' : 'дорослих'} · ${kids} ${ukPlural(kids, 'дитина', 'дитини', 'дітей')} · 1 номер`

  function allowCheckIn(iso: string) {
    if (readOnly) return false
    if (live) return canStartCheckIn(live.status, live.hotelToday, live.days, iso)
    return canUseAsCheckIn(iso)
  }

  function allowCheckOut(iso: string) {
    if (readOnly) return false
    if (live) return canFinishCheckOut(live.status, live.hotelToday, live.days, checkIn, iso)
    return canUseAsCheckOut(checkIn, iso)
  }

  function selectDay(iso: string) {
    if (pickingOut) {
      if (allowCheckOut(iso)) {
        onChange({ checkOut: iso })
        setPanel(null)
        setHover('')
        return
      }
      if (allowCheckIn(iso)) {
        onChange({ checkIn: iso, checkOut: '' })
      }
      return
    }
    if (!allowCheckIn(iso)) return
    onChange({ checkIn: iso, checkOut: '' })
  }

  function inRange(iso: string) {
    const end = checkOut || previewOut
    if (!checkIn || !end || end <= checkIn) return false
    return iso >= checkIn && iso < end
  }

  return (
    <div ref={root} className="@container relative">
      <div className="grid overflow-hidden border border-[#c4a35a] bg-linen @min-[20rem]:grid-cols-2">
        <button
          type="button"
          aria-expanded={panel === 'dates'}
          onClick={() => setPanel((value) => (value === 'dates' ? null : 'dates'))}
          className="flex min-h-14 items-center justify-between gap-4 px-5 py-4 text-left @min-[20rem]:border-r @min-[20rem]:border-[#c4a35a]"
        >
          <span>
            <span className="block text-[0.68rem] font-medium tracking-[0.14em] uppercase text-wood/55">
              Виберіть дати
            </span>
            <span className="mt-1 block text-sm">{dateLabel}</span>
          </span>
          <CalendarIcon />
        </button>
        <button
          type="button"
          aria-expanded={panel === 'guests'}
          onClick={() => setPanel((value) => (value === 'guests' ? null : 'guests'))}
          className="flex min-h-14 items-center justify-between gap-4 border-t border-[#c4a35a] px-5 py-4 text-left @min-[20rem]:border-t-0"
        >
          <span>
            <span className="block text-[0.68rem] font-medium tracking-[0.14em] uppercase text-wood/55">
              Виберіть місткість
            </span>
            <span className="mt-1 block text-sm">{guestLabel}</span>
          </span>
          <PersonIcon />
        </button>
      </div>

      {panel === 'dates' && place ? (
      <div
        data-calendar
        className="fixed z-50 overflow-x-hidden overflow-y-auto overscroll-contain border border-wood/10 bg-linen p-4 shadow-[0_16px_40px_rgba(91,56,43,0.12)] sm:p-6"
        style={{ top: place.top, left: place.left, width: place.width, maxHeight: place.maxHeight }}
      >
          <div className={`grid gap-x-10 gap-y-8 ${calendarUsesTwoMonths(place.width) ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <MonthGrid
              year={months[0].year}
              monthIndex={months[0].monthIndex}
              checkIn={checkIn}
              checkOut={checkOut}
              previewOut={previewOut}
              pickingOut={pickingOut}
              live={live}
              inRange={inRange}
              allowCheckIn={allowCheckIn}
              allowCheckOut={allowCheckOut}
              onHover={setHover}
              onSelect={selectDay}
              showPrev
              showNext
              narrowNextOnly={calendarUsesTwoMonths(place.width)}
              canGoBack={canGoBack}
              onPrev={() => setCursor((value) => addMonths(value.year, value.monthIndex, -1))}
              onNext={() => setCursor((value) => addMonths(value.year, value.monthIndex, 1))}
            />
            <MonthGrid
              className={calendarUsesTwoMonths(place.width) ? '' : 'hidden'}
              year={months[1].year}
              monthIndex={months[1].monthIndex}
              checkIn={checkIn}
              checkOut={checkOut}
              previewOut={previewOut}
              pickingOut={pickingOut}
              live={live}
              inRange={inRange}
              allowCheckIn={allowCheckIn}
              allowCheckOut={allowCheckOut}
              onHover={setHover}
              onSelect={selectDay}
              showPrev={false}
              showNext
              canGoBack={canGoBack}
              onPrev={() => setCursor((value) => addMonths(value.year, value.monthIndex, -1))}
              onNext={() => setCursor((value) => addMonths(value.year, value.monthIndex, 1))}
            />
          </div>
          {live ? (
            <CalendarLegend
              status={live.status}
              error={live.error}
              capacityNote={live.capacityNote}
              loadingQuote={loading}
              detail={hoverDetail(live, hover)}
            />
          ) : (
            <p className="mt-6 text-[0.72rem] text-wood/50">
              Дати з сервера. Минулі дні та перебування довше ніж 30 ночей обрати не можна.
              {loading ? ' Перевіряємо наявність…' : ''}
            </p>
          )}
          <p className="mt-1 text-sm text-wood/70">{dateLabel}</p>
      </div>
      ) : null}

      {panel === 'guests' ? (
        <div className="absolute right-0 z-40 mt-2 w-full max-w-sm border border-wood/10 bg-linen p-5 shadow-[0_16px_40px_rgba(91,56,43,0.12)]">
          <Stepper
            label="Дорослі"
            value={adults}
            min={1}
            max={Math.max(1, MAX_GUESTS - kids)}
            onChange={(value) => onChange({ adults: value })}
          />
          <Stepper
            label="Діти"
            value={kids}
            min={0}
            max={Math.max(0, MAX_GUESTS - adults)}
            onChange={(value) => onChange({ children: value })}
          />
          <Stepper label="Номери" value={1} min={1} max={1} onChange={() => undefined} />
          <p className="mt-3 text-[0.72rem] text-wood/50">
            Разом {guestTotal} {ukPlural(guestTotal, 'гість', 'гості', 'гостей')}. Одна заявка — одна
            кімната.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function shiftIso(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function moveCalendarFocus(current: HTMLButtonElement, days: number) {
  const iso = current.dataset.date
  if (!iso) return
  const next = current.closest('[data-calendar]')?.querySelector<HTMLButtonElement>(`[data-date="${shiftIso(iso, days)}"]`)
  next?.focus()
}

function MonthGrid({
  year,
  monthIndex,
  checkIn,
  checkOut,
  previewOut,
  pickingOut,
  live,
  inRange,
  allowCheckIn,
  allowCheckOut,
  onHover,
  onSelect,
  showPrev,
  showNext,
  narrowNextOnly = false,
  canGoBack,
  onPrev,
  onNext,
  className = '',
}: {
  year: number
  monthIndex: number
  checkIn: string
  checkOut: string
  previewOut: string
  pickingOut: boolean
  live?: Props['live']
  inRange: (iso: string) => boolean
  allowCheckIn: (iso: string) => boolean
  allowCheckOut: (iso: string) => boolean
  onHover: (iso: string) => void
  onSelect: (iso: string) => void
  showPrev: boolean
  showNext: boolean
  narrowNextOnly?: boolean
  canGoBack: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  const cells = useMemo(() => monthCells(year, monthIndex), [year, monthIndex])
  const rangeEnd = checkOut || previewOut

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        {showPrev ? (
          <button
            type="button"
            aria-label="Попередній місяць"
            disabled={!canGoBack}
            onClick={onPrev}
            className="h-11 w-11 shrink-0 text-lg disabled:opacity-20"
          >
            ‹
          </button>
        ) : (
          <span className="h-11 w-11 shrink-0" />
        )}
        <p className="min-w-0 flex-1 whitespace-nowrap text-center text-base font-medium">
          {formatMonthTitle(year, monthIndex)}
        </p>
        {showNext ? (
          <button
            type="button"
            aria-label="Наступний місяць"
            onClick={onNext}
            className={`h-11 w-11 shrink-0 text-lg ${narrowNextOnly ? 'invisible' : ''}`}
          >
            ›
          </button>
        ) : (
          <span className="h-11 w-11 shrink-0" />
        )}
      </div>
      <div className="grid grid-cols-7 text-center">
        {weekdaysMon.map((day) => (
          <span key={day} className="pb-2 text-[0.65rem] uppercase tracking-[0.08em] text-wood/40">
            {day}
          </span>
        ))}
        {cells.map((iso, index) => {
          if (!iso) return <span key={`empty-${index}`} className="h-14" />
          const visual: DayVisual | 'open' = live
            ? dayVisual(live.status, live.hotelToday, live.days, iso)
            : iso < todayIso()
              ? 'past'
              : 'open'
          const checkoutOnly = Boolean(live && pickingOut && allowCheckOut(iso) && visual !== 'available' && visual !== 'past')
          const selectable = pickingOut ? allowCheckOut(iso) || allowCheckIn(iso) : allowCheckIn(iso)
          const isIn = iso === checkIn
          const isOut = Boolean(rangeEnd) && iso === rangeEnd && iso !== checkIn
          const edge = isIn || isOut
          const mid = inRange(iso) && !edge
          const showBar = Boolean(rangeEnd && rangeEnd > checkIn && (mid || isIn || isOut))
          const reason = live?.days[iso]?.reason ?? null
          const explanation =
            live && visual !== 'open' ? dayStatusCopy(visual, reason) : visual === 'past' ? 'Минула дата' : ''
          return (
            <button
              key={iso}
              type="button"
              aria-disabled={!selectable}
              aria-label={
                live
                  ? dayAriaLabel(iso, visual === 'open' ? 'unknown' : visual, checkoutOnly, reason)
                  : `${formatDate(iso)}${visual === 'past' ? ', минула дата' : ''}`
              }
              title={explanation && !selectable ? explanation : undefined}
              aria-pressed={edge || undefined}
              data-date={iso}
              data-availability={live ? visual : undefined}
              onMouseEnter={() => onHover(iso)}
              onMouseLeave={() => onHover('')}
              onFocus={() => onHover(iso)}
              onClick={() => {
                if (selectable) onSelect(iso)
              }}
              onKeyDown={(event) => {
                const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? 7 : event.key === 'ArrowUp' ? -7 : 0
                if (!step) return
                event.preventDefault()
                moveCalendarFocus(event.currentTarget, step)
              }}
              className={`relative h-14 min-w-0 touch-manipulation ${selectable ? '' : 'cursor-not-allowed'}`}
            >
              {showBar ? (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-2 bg-beige/80 ${isIn ? 'left-1/2 right-0' : isOut ? 'right-1/2 left-0' : 'inset-x-0'}`}
                />
              ) : null}
              <span className={numberClass(visual, edge)}>{Number(iso.slice(8))}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-wood/10 py-3 last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Менше: ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="h-11 w-11 border border-wood/20 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-sm">{value}</span>
        <button
          type="button"
          aria-label={`Більше: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="h-11 w-11 border border-wood/20 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}

function numberClass(visual: DayVisual | 'open', edge: boolean) {
  const base = 'pointer-events-none relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[0.95rem] leading-none'
  if (edge) return `${base} bg-clay font-semibold text-linen`
  if (visual === 'available' || visual === 'open') return `${base} font-semibold text-wood`
  if (visual === 'booked') return `${base} font-semibold text-clay/75 line-through decoration-clay decoration-2`
  if (visual === 'past') return `${base} font-medium text-wood/30`
  return `${base} font-medium text-wood/40`
}

function hoverDetail(
  live: NonNullable<Props['live']>,
  iso: string,
) {
  if (!iso || live.status !== 'ready') return ''
  const visual = dayVisual(live.status, live.hotelToday, live.days, iso)
  if (visual === 'available') return ''
  return dayStatusCopy(visual, live.days[iso]?.reason ?? null)
}

function CalendarLegend({
  status,
  error,
  capacityNote,
  loadingQuote,
  detail,
}: {
  status: CalendarLoadStatus
  error?: string
  capacityNote?: string
  loadingQuote: boolean
  detail: string
}) {
  const message =
    status === 'error'
      ? error || 'Не вдалося дізнатися наявність. Дати не показано як вільні.'
      : status === 'loading'
        ? 'Перевіряємо наявність… Дати ще не можна обирати.'
        : detail ||
          capacityNote ||
          'Темні дати можна обрати. Закреслена ніч зайнята: її не включаємо в проживання, але виїзд можна поставити на ранок, коли номер звільняється.'
  return (
    <div className="mt-6">
      <p className="text-[0.68rem] tracking-[0.14em] uppercase text-wood/50">Легенда</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[0.72rem] text-wood/70">
        <li className="flex items-center gap-2">
          <span className="font-semibold text-wood" aria-hidden="true">
            12
          </span>
          Вільно
        </li>
        <li className="flex items-center gap-2">
          <span className="font-semibold text-clay/75 line-through decoration-clay decoration-2" aria-hidden="true">
            12
          </span>
          Немає місць
        </li>
        <li className="flex items-center gap-2">
          <span className="font-medium text-wood/40" aria-hidden="true">
            12
          </span>
          Немає тарифу або кімната не підходить
        </li>
        <li className="flex items-center gap-2">
          <span className="font-medium text-wood/30" aria-hidden="true">
            12
          </span>
          Минулі
        </li>
      </ul>
      <p className="mt-3 text-[0.72rem] text-wood/60" role={status === 'error' ? 'alert' : 'status'}>
        {message}
        {loadingQuote && status === 'ready' ? ' Уточнюємо ціну…' : ''}
      </p>
    </div>
  )
}

function ukPlural(count: number, one: string, few: string, many: string) {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-wood/55" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 9.5 H20.5 M8 3.5 V7 M16 3.5 V7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-wood/55" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 19.5 C6.2 15.8 8.6 14 12 14 C15.4 14 17.8 15.8 19 19.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

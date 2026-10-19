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
import { calendarPopoverWidth, calendarUsesTwoMonths } from '../lib/publicBooking/roomIdentity'
import { MAX_GUESTS } from '../lib/publicBooking/types'
import type { PublicCalendarDay } from '../lib/publicBooking/types'
import {
  addMonths,
  formatDate,
  formatDayMonth,
  formatMonthTitle,
  monthCells,
  todayIso,
  weekdayMon0,
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
    earliestCheckIn?: string | null
    days: Record<string, PublicCalendarDay>
    error?: string
    capacityNote?: string
  }
  onVisibleRange?: (range: { from: string; to: string }) => void
  /** Room-page card anchors the popover to its right edge so it can grow left. */
  align?: 'start' | 'end'
  blockedCheckIns?: ReadonlySet<string>
  blockedRanges?: ReadonlySet<string>
  notice?: string
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
  blockedCheckIns,
  blockedRanges,
  notice = '',
  onChange,
}: Props) {
  const now = new Date()
  const root = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [place, setPlace] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const [hover, setHover] = useState('')
  const [focusIso, setFocusIso] = useState('')
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
      const widthWanted = calendarPopoverWidth(vw, rect.width, align)
      let width = widthWanted
      let left = align === 'end' ? rect.right - width : rect.left
      if (left + width > vw - margin) left = vw - margin - width
      if (left < margin) left = margin
      width = Math.min(width, vw - margin - left)
      const vh = window.innerHeight
      const ideal = Math.min(480, vh - margin * 2)
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
    if (readOnly || blockedCheckIns?.has(iso)) return false
    if (live) return canStartCheckIn(live.status, live.hotelToday, live.days, iso, blockedCheckIns, live.earliestCheckIn)
    return canUseAsCheckIn(iso)
  }

  function allowCheckOut(iso: string) {
    if (readOnly || blockedCheckIns?.has(checkIn) || blockedRanges?.has(`${checkIn}|${iso}`)) return false
    if (live) return canFinishCheckOut(live.status, live.hotelToday, live.days, checkIn, iso, blockedRanges, live.earliestCheckIn)
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
      {notice ? (
        <p className="mt-3 text-sm text-clay" role="alert">
          {notice}
        </p>
      ) : null}

      {panel === 'dates' && place ? (
      <div
        data-calendar
        className="fixed z-50 max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto overscroll-contain border border-wood/10 bg-linen p-3 shadow-[0_16px_40px_rgba(91,56,43,0.12)] sm:p-5"
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
              onFocusDate={setFocusIso}
              tabIso={focusIso || checkIn}
              fallbackTab
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
              onFocusDate={setFocusIso}
              tabIso={focusIso || checkIn}
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
            <p className="mt-4 text-[0.72rem] text-wood/50">
              Минулі дні та перебування довше ніж 30 ночей обрати не можна.
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
          <Stepper label="Помешкання" value={1} min={1} max={1} onChange={() => undefined} />
          <p className="mt-3 text-[0.72rem] text-wood/50">
            Разом {guestTotal} {ukPlural(guestTotal, 'гість', 'гості', 'гостей')}. Одна заявка — одне
            помешкання.
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
  onFocusDate,
  tabIso,
  fallbackTab = false,
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
  onFocusDate: (iso: string) => void
  tabIso: string
  fallbackTab?: boolean
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
            className="h-9 w-9 shrink-0 text-lg disabled:opacity-20"
          >
            ‹
          </button>
        ) : (
          <span className="h-9 w-9 shrink-0" />
        )}
        <p className="min-w-0 flex-1 whitespace-nowrap text-center text-base font-medium">
          {formatMonthTitle(year, monthIndex)}
        </p>
        {showNext ? (
          <button
            type="button"
            aria-label="Наступний місяць"
            onClick={onNext}
            className={`h-9 w-9 shrink-0 text-lg ${narrowNextOnly ? 'invisible' : ''}`}
          >
            ›
          </button>
        ) : (
          <span className="h-9 w-9 shrink-0" />
        )}
      </div>
      <div className="grid grid-cols-7 text-center">
        {weekdaysMon.map((day) => (
          <span key={day} className="pb-2 text-[0.65rem] uppercase tracking-[0.08em] text-wood/40">
            {day}
          </span>
        ))}
        {cells.map((iso, index) => {
          if (!iso) return <span key={`empty-${index}`} className="aspect-square" />
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
                !selectable && (visual === 'available' || visual === 'open')
                  ? `${formatDate(iso)}, заїзд недоступний`
                  : live
                    ? dayAriaLabel(iso, visual === 'open' ? 'unknown' : visual, checkoutOnly, reason)
                    : `${formatDate(iso)}${visual === 'past' ? ', минула дата' : ''}`
              }
              title={explanation && !selectable ? explanation : undefined}
              aria-pressed={edge || undefined}
              data-date={iso}
              data-availability={live ? visual : undefined}
              tabIndex={iso === tabIso || (fallbackTab && !tabIso && iso === cells.find(Boolean)) ? 0 : -1}
              onMouseEnter={() => onHover(iso)}
              onMouseLeave={() => onHover('')}
              onFocus={() => {
                onHover(iso)
                onFocusDate(iso)
              }}
              onClick={() => {
                if (selectable) onSelect(iso)
              }}
              onKeyDown={(event) => {
                const weekIndex = weekdayMon0(iso)
                const step =
                  event.key === 'ArrowRight'
                    ? 1
                    : event.key === 'ArrowLeft'
                      ? -1
                      : event.key === 'ArrowDown'
                        ? 7
                        : event.key === 'ArrowUp'
                          ? -7
                          : event.key === 'Home'
                            ? -weekIndex
                            : event.key === 'End'
                              ? 6 - weekIndex
                              : 0
                if (!step) return
                event.preventDefault()
                moveCalendarFocus(event.currentTarget, step)
              }}
              className={`relative aspect-square min-w-0 touch-manipulation focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay ${selectable ? '' : 'cursor-not-allowed'}`}
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
  const base = 'pointer-events-none relative z-10 mx-auto flex aspect-square w-[78%] items-center justify-center rounded-full text-sm leading-none'
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
        ? 'Перевіряємо наявність. Дати ще не можна обирати.'
        : detail || capacityNote || 'Виїзд можна поставити на ранок наступного бронювання. Ця ніч у проживання не входить.'
  return (
    <div className="mt-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-wood/70">
        <li className="flex items-center gap-2">
          <span className="font-semibold text-wood" aria-hidden="true">
            12
          </span>
          Вільно
        </li>
        <li className="flex items-center gap-2">
          <span className="font-semibold text-clay/75 line-through" aria-hidden="true">
            12
          </span>
          Зайнято
        </li>
        <li className="flex items-center gap-2">
          <span className="font-medium text-wood/35" aria-hidden="true">
            12
          </span>
          Недоступно
        </li>
      </ul>
      <p className="mt-2 text-[0.72rem] text-wood/60" role={status === 'error' ? 'alert' : 'status'}>
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

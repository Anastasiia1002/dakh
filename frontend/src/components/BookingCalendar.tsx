import { useEffect, useMemo, useRef, useState } from 'react'
import {
  canUseAsCheckIn,
  canUseAsCheckOut,
  guestCountOf,
  latestCheckOut,
} from '../lib/publicBooking'
import { MAX_GUESTS } from '../lib/publicBooking/types'
import {
  addMonths,
  formatDayMonth,
  formatMonthTitle,
  formatPriceK,
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
  align?: 'start' | 'end'
  nightPrices?: Record<string, string>
  loading?: boolean
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
  align = 'start',
  nightPrices = {},
  loading = false,
  onChange,
}: Props) {
  const now = new Date()
  const root = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<Panel>(null)
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

  const dateLabel =
    checkIn && checkOut
      ? `${formatDayMonth(checkIn)} — ${formatDayMonth(checkOut)}`
      : checkIn
        ? `${formatDayMonth(checkIn)} — Дата виїзду`
        : 'Дата заїзду — Дата виїзду'

  const guestLabel = `${adults} ${adults === 1 ? 'дорослий' : 'дорослих'} · ${kids} ${ukPlural(kids, 'дитина', 'дитини', 'дітей')} · 1 номер`

  function selectDay(iso: string) {
    if (pickingOut) {
      if (canUseAsCheckOut(checkIn, iso)) {
        onChange({ checkOut: iso })
        setPanel(null)
        setHover('')
        return
      }
      if (canUseAsCheckIn(iso)) {
        onChange({ checkIn: iso, checkOut: '' })
      }
      return
    }
    if (!canUseAsCheckIn(iso)) return
    onChange({ checkIn: iso, checkOut: '' })
  }

  function inRange(iso: string) {
    const end = checkOut || previewOut
    if (!checkIn || !end || end <= checkIn) return false
    return iso >= checkIn && iso < end
  }

  return (
    <div ref={root} className="relative">
      <div className="grid overflow-hidden border border-[#c4a35a] bg-linen md:grid-cols-2">
        <button
          type="button"
          aria-expanded={panel === 'dates'}
          onClick={() => setPanel((value) => (value === 'dates' ? null : 'dates'))}
          className="flex items-center justify-between gap-4 px-5 py-4 text-left md:border-r md:border-[#c4a35a]"
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
          className="flex items-center justify-between gap-4 border-t border-[#c4a35a] px-5 py-4 text-left md:border-t-0"
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

      {panel === 'dates' ? (
        <div
          className={`absolute z-40 mt-2 w-full min-w-[min(100%,20rem)] border border-wood/10 bg-linen p-5 shadow-[0_16px_40px_rgba(91,56,43,0.12)] md:w-[min(46rem,calc(100vw-3rem))] ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="grid gap-10 md:grid-cols-2">
            {months.map((month, index) => (
              <MonthGrid
                key={`${month.year}-${month.monthIndex}`}
                year={month.year}
                monthIndex={month.monthIndex}
                checkIn={checkIn}
                checkOut={checkOut}
                previewOut={previewOut}
                nightPrices={nightPrices}
                pickingOut={pickingOut}
                inRange={inRange}
                onHover={setHover}
                onSelect={selectDay}
                showPrev={index === 0}
                showNext={index === 1}
                canGoBack={canGoBack}
                onPrev={() => setCursor((value) => addMonths(value.year, value.monthIndex, -1))}
                onNext={() => setCursor((value) => addMonths(value.year, value.monthIndex, 1))}
              />
            ))}
          </div>
          <p className="mt-6 text-[0.72rem] text-wood/50">
            Дати з сервера. Минулі дні та перебування довше ніж 30 ночей обрати не можна.
            {loading ? ' Перевіряємо наявність…' : ''}
          </p>
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

function MonthGrid({
  year,
  monthIndex,
  checkIn,
  checkOut,
  previewOut,
  nightPrices,
  pickingOut,
  inRange,
  onHover,
  onSelect,
  showPrev,
  showNext,
  canGoBack,
  onPrev,
  onNext,
}: {
  year: number
  monthIndex: number
  checkIn: string
  checkOut: string
  previewOut: string
  nightPrices: Record<string, string>
  pickingOut: boolean
  inRange: (iso: string) => boolean
  onHover: (iso: string) => void
  onSelect: (iso: string) => void
  showPrev: boolean
  showNext: boolean
  canGoBack: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const cells = useMemo(() => monthCells(year, monthIndex), [year, monthIndex])
  const lastOut = checkIn ? latestCheckOut(checkIn) : ''

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {showPrev ? (
          <button
            type="button"
            aria-label="Попередній місяць"
            disabled={!canGoBack}
            onClick={onPrev}
            className="px-1 text-lg disabled:opacity-20"
          >
            ‹
          </button>
        ) : (
          <span className="w-5" />
        )}
        <p className="text-sm font-medium">{formatMonthTitle(year, monthIndex)}</p>
        {showNext ? (
          <button type="button" aria-label="Наступний місяць" onClick={onNext} className="px-1 text-lg">
            ›
          </button>
        ) : (
          <span className="w-5" />
        )}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekdaysMon.map((day) => (
          <span key={day} className="pb-2 text-[0.65rem] uppercase tracking-[0.08em] text-wood/40">
            {day}
          </span>
        ))}
        {cells.map((iso, index) => {
          if (!iso) return <span key={`empty-${index}`} />
          const past = iso < todayIso()
          const selectable = pickingOut
            ? canUseAsCheckOut(checkIn, iso) || canUseAsCheckIn(iso)
            : canUseAsCheckIn(iso)
          const edge = iso === checkIn || iso === checkOut || iso === previewOut
          const mid = inRange(iso) && !edge
          const price = nightPrices[iso]
          const beyondStay = Boolean(pickingOut && checkIn && iso > lastOut)
          return (
            <button
              key={iso}
              type="button"
              disabled={!selectable}
              onMouseEnter={() => onHover(iso)}
              onMouseLeave={() => onHover('')}
              onFocus={() => onHover(iso)}
              onClick={() => onSelect(iso)}
              className={`min-h-[3.4rem] px-0.5 py-1 ${
                edge ? 'bg-clay text-linen' : mid ? 'bg-beige' : ''
              } ${selectable ? 'hover:bg-beige' : 'cursor-not-allowed text-wood/30'} ${
                edge ? 'hover:bg-clay' : ''
              }`}
            >
              <span className="block text-[0.85rem] font-medium leading-none">{Number(iso.slice(8))}</span>
              <span className={`mt-1 block text-[0.62rem] leading-none ${edge ? 'text-linen/80' : 'text-wood/45'}`}>
                {past || beyondStay ? '—' : price ? formatPriceK(Number(price)) : ''}
              </span>
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
          className="h-8 w-8 border border-wood/20 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-sm">{value}</span>
        <button
          type="button"
          aria-label={`Більше: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 border border-wood/20 disabled:opacity-30"
        >
          +
        </button>
      </div>
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

import { Link } from 'react-router-dom'

type Tone = 'wood' | 'linen' | 'clay'

const toneClass: Record<Tone, string> = {
  wood: 'text-wood',
  linen: 'text-linen',
  clay: 'text-clay',
}

export function BirdMark({ className = 'h-8 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 36" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4 26C18 8 34 4 46 13C52 6 64 5 70 12C56 15 50 22 46 28C38 18 20 20 4 26Z" />
    </svg>
  )
}

export function DakhLogo({
  tone = 'wood',
  compact = false,
}: {
  tone?: Tone
  compact?: boolean
}) {
  return (
    <Link to="/" className={`inline-flex flex-col items-center ${toneClass[tone]}`} aria-label="DAKH, на головну">
      <BirdMark className={compact ? 'h-5 w-9' : 'h-7 w-12'} />
      <span className={`font-display leading-none ${compact ? 'text-2xl' : 'text-[1.85rem]'}`}>dakh</span>
      {compact ? null : (
        <span className="mt-1 text-[0.58rem] font-medium tracking-[0.22em] uppercase">
          Вище даху тільки небо
        </span>
      )}
    </Link>
  )
}

export function Spot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path
        d="M10 90 C40 20 90 10 140 40 C170 60 190 40 195 80 C160 110 70 130 10 90Z"
        fill="currentColor"
      />
    </svg>
  )
}

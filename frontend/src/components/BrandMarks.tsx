import { Link } from 'react-router-dom'

type Tone = 'wood' | 'linen' | 'clay'

const logoSrc: Record<Tone, string> = {
  wood: '/images/dakh-logo-wood.png',
  clay: '/images/dakh-logo-wood.png',
  linen: '/images/dakh-logo.png',
}

export function DakhLogo({
  tone = 'wood',
  compact = false,
}: {
  tone?: Tone
  compact?: boolean
}) {
  return (
    <Link to="/" className="inline-flex flex-col items-center" aria-label="DAKH, на головну">
      <img
        src={logoSrc[tone]}
        alt=""
        className={compact ? 'h-11 w-auto md:h-12' : 'h-[4.75rem] w-auto'}
      />
      {compact ? null : (
        <span className="mt-2 text-[0.58rem] font-medium tracking-[0.22em] uppercase text-wood">
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

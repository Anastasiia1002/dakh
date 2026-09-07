import { Link } from 'react-router-dom'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="DAKH, на головну">
      <span
        className={`grid h-10 w-10 place-items-center rounded-full border text-[1.05rem] font-display ${
          light
            ? 'border-linen/50 text-linen'
            : 'border-wood text-wood'
        }`}
      >
        D
      </span>
      <span className={`font-display text-2xl leading-none tracking-wide ${light ? 'text-linen' : 'text-wood'}`}>
        DAKH
      </span>
    </Link>
  )
}

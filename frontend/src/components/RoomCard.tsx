import { Link } from 'react-router-dom'
import type { Stay } from '../data/catalog'
import { formatMoney } from '../lib/format'
import { Photo } from './Photo'

export function RoomCard({ stay }: { stay: Stay }) {
  return (
    <article className="group">
      <Link to={`/gotel/${stay.slug}`} className="block overflow-hidden">
        <Photo
          src={stay.images[0]}
          alt={stay.name}
          className="aspect-[4/3] w-full transition duration-700 group-hover:scale-[1.02]"
        />
      </Link>
      <p className="kicker mt-5 text-[0.68rem] text-clay">{stay.kicker}</p>
      <h3 className="font-display text-3xl">
        <Link to={`/gotel/${stay.slug}`}>{stay.name}</Link>
      </h3>
      <p className="mt-2 text-sm text-wood/75">{stay.summary}</p>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium">{formatMoney(stay.priceFrom)} / доба</p>
        <Link
          to={`/gotel/${stay.slug}`}
          className="text-[0.72rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          Детальніше
        </Link>
      </div>
    </article>
  )
}

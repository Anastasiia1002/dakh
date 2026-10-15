import { Link } from 'react-router-dom'
import { capacityLabel, kindLabel, publicSummary, publicTitle } from '../lib/catalog/display'
import { accommodationPath } from '../lib/catalog/routes'
import type { PublicAccommodation } from '../lib/publicBooking/types'
import { Photo } from './Photo'

export function RoomCard({ accommodation }: { accommodation: PublicAccommodation }) {
  const to = accommodationPath(accommodation.hotelSlug, accommodation.slug)
  const summary = publicSummary(accommodation.description)
  const title = publicTitle(accommodation.name, accommodation.maxGuests)

  return (
    <article className="group">
      <Link to={to} className="block overflow-hidden">
        <Photo
          src={accommodation.cover.url}
          alt={accommodation.cover.alt || title}
          className="aspect-[4/3] w-full transition duration-700 group-hover:scale-[1.02]"
        />
      </Link>
      <p className="kicker mt-5 text-[0.68rem] text-clay">{kindLabel(accommodation.kind)}</p>
      <h3 className="font-display text-3xl">
        <Link to={to}>{title}</Link>
      </h3>
      {summary ? <p className="mt-2 line-clamp-3 text-sm text-wood/75">{summary}</p> : null}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium">{capacityLabel(accommodation.maxGuests)}</p>
        <Link
          to={to}
          className="text-[0.72rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          Детальніше
        </Link>
      </div>
    </article>
  )
}

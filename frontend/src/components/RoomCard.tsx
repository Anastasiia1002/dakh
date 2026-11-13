import { Link } from 'react-router-dom'
import { AmenityIcon } from './AmenityIcon'
import { cardAmenities } from '../lib/catalog/amenities'
import { capacityLabel, cardTitle, kindLabel, publicSummary } from '../lib/catalog/display'
import { accommodationHref } from '../lib/catalog/routes'
import { withStayUrl, type StayUrlState } from '../lib/publicBooking/stayUrl'
import type { PublicAccommodation } from '../lib/publicBooking/types'
import { Photo } from './Photo'

export function RoomCard({
  accommodation,
  priority = false,
  stay,
}: {
  accommodation: PublicAccommodation
  priority?: boolean
  stay?: StayUrlState
}) {
  const to = stay ? withStayUrl(accommodationHref(accommodation), stay) : accommodationHref(accommodation)
  const summary = publicSummary(accommodation.description)
  const title = cardTitle(accommodation.name, accommodation.maxGuests)
  const amenities = cardAmenities(accommodation.amenities)

  return (
    <article className="group">
      <Link to={to} className="block overflow-hidden">
        <Photo
          src={accommodation.cover.url}
          alt={accommodation.cover.alt || title}
          priority={priority}
          className="aspect-[4/3] w-full transition duration-700 group-hover:scale-[1.02]"
        />
      </Link>
      <p className="kicker mt-5 text-[0.68rem] text-clay">{kindLabel(accommodation.kind)}</p>
      <h3 className="font-display text-[1.75rem] leading-[1.15]">
        <Link to={to} className="block text-balance">
          {title}
        </Link>
      </h3>
      {summary ? <p className="mt-2 line-clamp-3 text-sm text-wood/75">{summary}</p> : null}
      {amenities.length > 0 ? (
        <ul className="mt-3 flex max-w-full flex-wrap gap-x-3 gap-y-1">
          {amenities.map((amenity) => (
            <li key={amenity.key} className="inline-flex min-w-0 items-center gap-1.5 text-xs text-wood/75">
              <AmenityIcon iconKey={amenity.iconKey} className="size-3.5 shrink-0" />
              <span className="break-words">{amenity.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
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

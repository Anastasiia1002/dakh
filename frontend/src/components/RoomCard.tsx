import { Link } from 'react-router-dom'
import { AmenityIcon } from './AmenityIcon'
import { cardAmenities } from '../lib/catalog/amenities'
import { capacityLabel, cardTitle, kindLabel, publicSummary } from '../lib/catalog/display'
import { accommodationHref } from '../lib/catalog/routes'
import { stayUrlHasRange, withStayUrl, type StayUrlState } from '../lib/publicBooking/stayUrl'
import type { PublicAccommodation } from '../lib/publicBooking/types'
import { Photo } from './Photo'

const bookingEnabled = import.meta.env?.VITE_BOOKING_ENABLED === 'true'

export function RoomCard({
  accommodation,
  priority = false,
  stay,
  photoClassName = 'aspect-[4/3]',
}: {
  accommodation: PublicAccommodation
  priority?: boolean
  stay?: StayUrlState
  photoClassName?: string
}) {
  const to = stay ? withStayUrl(accommodationHref(accommodation), stay) : accommodationHref(accommodation)
  const summary = publicSummary(accommodation.description)
  const title = cardTitle(accommodation.name, accommodation.maxGuests)
  const amenities = cardAmenities(accommodation.amenities)
  const detailLabel = accommodation.kind === 'COTTAGE' ? 'Переглянути будинок' : 'Переглянути кімнату'

  return (
    <article className="group">
      <Link to={to} className="block overflow-hidden">
        <Photo
          src={accommodation.cover.url}
          alt={accommodation.cover.alt || title}
          priority={priority}
          className={`${photoClassName} w-full transition duration-700 group-hover:scale-[1.02]`}
        />
      </Link>
      <p className="kicker mt-5 text-[0.68rem] text-clay">{kindLabel(accommodation.kind)}</p>
      <h3 className="font-display text-[1.85rem] leading-[1.12]">
        <Link to={to} className="block text-balance">
          {title}
        </Link>
      </h3>
      <p className="mt-2 text-sm font-medium">{capacityLabel(accommodation.maxGuests)}</p>
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
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link
          to={to}
          className="text-[0.72rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          {detailLabel}
        </Link>
        {bookingEnabled && stay && stayUrlHasRange(stay) ? (
          <Link
            to={to}
            className="text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-clay"
          >
            Перевірити наявність
          </Link>
        ) : null}
      </div>
    </article>
  )
}

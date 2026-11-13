import { lazy, Suspense, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { AmenityIcon } from '../components/AmenityIcon'
import { CatalogState } from '../components/CatalogState'
import { Photo } from '../components/Photo'
import { PhotoGallery } from '../components/PhotoGallery'
import { RoomCard } from '../components/RoomCard'
import { site } from '../data/catalog'
import { amenityGroups, cardAmenities, detailPreviewAmenities, showAmenityGroupHeading } from '../lib/catalog/amenities'
import {
  capacityLabel,
  galleryImages,
  kindLabel,
  publicDescription,
  publicTitle,
  stayPolicyLine,
} from '../lib/catalog/display'
import {
  apiHotelSlug,
  categoryBase,
  toApiAccommodationSlug,
  toPublicAccommodationSlug,
  type AccommodationCategory,
} from '../lib/catalog/categories'
import { catalogRedirect } from '../lib/catalog/routes'
import { useAccommodation, useAccommodationList } from '../lib/catalog/useAccommodations'
import { stayUrlFromSearch } from '../lib/publicBooking/stayUrl'
import type { PublicAccommodation, PublicAmenity } from '../lib/publicBooking/types'

const ActiveRoomBooking =
  import.meta.env?.VITE_BOOKING_ENABLED === 'true'
    ? lazy(() => import('../components/booking/RoomBooking').then((module) => ({ default: module.RoomBooking })))
    : null

export function RoomPage({ category }: { category: AccommodationCategory }) {
  const { slug = '' } = useParams()
  const location = useLocation()
  const redirect = catalogRedirect(location.pathname)
  if (redirect) return <Navigate to={redirect} replace />

  const decoded = decodeURIComponent(slug)
  const apiSlug = toApiAccommodationSlug(category, decoded)
  if (!apiSlug) return <Navigate to={categoryBase(category)} replace />

  return <AccommodationDetail category={category} apiSlug={apiSlug} />
}

function AccommodationDetail({ category, apiSlug }: { category: AccommodationCategory; apiSlug: string }) {
  const [params] = useSearchParams()
  const stay = stayUrlFromSearch(params)
  const detail = useAccommodation(category, apiSlug)
  const related = useAccommodationList(category)
  const room = detail.item
  const images = room ? galleryImages(room) : []
  const others = related.items.filter((item) => item.slug !== apiSlug)
  const listPath = categoryBase(category)
  const listLabel = category === 'rooms' ? 'Кімнати' : 'Будинки'
  const title = room ? publicTitle(room.name, room.maxGuests) : ''

  const opening = images[0]
  const highlights = room ? cardAmenities(room.amenities, 3) : []

  return (
    <article>
      {detail.status === 'ready' && room && opening ? (
        <section className="photo-grain relative min-h-[42svh] md:min-h-[56vh]">
          <Photo
            src={opening.url}
            alt={opening.alt || title}
            tone={false}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-wood/40" />
          <div className="relative flex min-h-[42svh] flex-col justify-end px-6 pb-16 pt-28 md:min-h-[56vh] md:px-10 md:pb-20">
            <nav aria-label="Шлях" className="text-[0.72rem] tracking-[0.12em] uppercase text-linen/75">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link to="/" className="underline decoration-linen/30 underline-offset-4 hover:text-linen">
                    Головна
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to={listPath} className="underline decoration-linen/30 underline-offset-4 hover:text-linen">
                    {listLabel}
                  </Link>
                </li>
              </ol>
            </nav>
            <p className="kicker mt-6 text-[0.68rem] text-linen/80">{kindLabel(room.kind)}</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] text-balance text-linen sm:text-5xl md:text-7xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-linen/90">{capacityLabel(room.maxGuests)}</p>
            {highlights.length > 0 ? (
              <ul className="mt-4 flex max-w-xl flex-wrap gap-x-5 gap-y-1 text-sm text-linen/85">
                {highlights.map((item) => (
                  <li key={item.key}>{item.label}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : detail.status === 'ready' && room ? (
        <header className="mx-auto max-w-6xl px-4 pt-28 sm:px-6">
          <h1 className="max-w-4xl font-display text-5xl leading-[1.08] text-balance">{title}</h1>
        </header>
      ) : (
        <div className="h-48 bg-beige" />
      )}

      {detail.status === 'ready' && room && images.length > 0 ? (
        <PhotoGallery key={room.id} images={images} title={title} />
      ) : null}

      <section className="mx-auto mt-8 grid max-w-6xl items-start gap-10 px-4 pb-28 sm:px-6 lg:mt-14 lg:grid-cols-[minmax(0,1.86fr)_minmax(18rem,1fr)] lg:gap-14 lg:pb-24">
        {detail.status === 'ready' && room ? (
          <>
            <div className="min-w-0">
              <AccommodationFacts room={room} />
              <div className="mt-10">
                <AccommodationStory room={room} />
              </div>
            </div>
            <div id="booking-panel" className="min-w-0 scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
              {ActiveRoomBooking ? (
                <Suspense fallback={<p className="border border-wood/10 bg-linen px-6 py-8 text-base text-wood/70">Завантажуємо дати…</p>}>
                  <ActiveRoomBooking
                    category={category}
                    apiSlug={room.slug}
                    publicSlug={toPublicAccommodationSlug(category, room.slug)}
                    displayName={title}
                    hotelSlug={apiHotelSlug(category) ?? ''}
                  />
                </Suspense>
              ) : null}
            </div>
          </>
        ) : (
          <CatalogState
            status={detail.status === 'ready' ? 'empty' : detail.status}
            error={detail.error}
            onRetry={detail.retry}
            emptyCopy="Це помешкання не знайдено."
          />
        )}
      </section>

      {others.length > 0 ? (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:mt-24">
          <h2 className="font-display text-4xl">Спробуйте також</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            {others.map((item) => (
              <RoomCard key={item.id} accommodation={item} stay={stay} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link
          to={listPath}
          className="inline-block text-sm tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          {category === 'rooms' ? 'Усі кімнати' : 'Усі будинки'}
        </Link>
      </div>
    </article>
  )
}

export function AccommodationHeading({ room }: { room: PublicAccommodation }) {
  return (
    <h1 className="max-w-4xl break-words font-display text-[2.5rem] leading-[1.08] text-balance sm:text-5xl lg:text-6xl">
      {publicTitle(room.name, room.maxGuests)}
    </h1>
  )
}

export function AccommodationFacts({ room }: { room: PublicAccommodation }) {
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y border-wood/10 py-5">
      <div>
        <dt className="text-[0.72rem] font-medium tracking-[0.14em] uppercase text-wood/55">Тип</dt>
        <dd className="mt-1 text-base font-medium">{kindLabel(room.kind)}</dd>
      </div>
      <div>
        <dt className="text-[0.72rem] font-medium tracking-[0.14em] uppercase text-wood/55">Місткість</dt>
        <dd className="mt-1 text-base font-medium">{capacityLabel(room.maxGuests)}</dd>
      </div>
    </dl>
  )
}

const AMENITY_PREVIEW = 8

export function AmenitiesSection({ amenities }: { amenities: readonly PublicAmenity[] | undefined }) {
  const [expanded, setExpanded] = useState(false)
  const items = amenityGroups(amenities).flatMap((group) => group.items)
  if (items.length === 0) return null
  const preview = detailPreviewAmenities(items, AMENITY_PREVIEW)
  const canToggle = items.length > preview.length
  const collapsed = canToggle && !expanded
  const shown = collapsed ? preview : items
  const groups = collapsed ? [{ category: 'PREVIEW', label: '', items: shown }] : amenityGroups(shown)
  return (
    <section aria-labelledby="amenities-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="amenities-heading" className="font-display text-4xl leading-tight">
          Зручності
        </h2>
        {canToggle ? (
          <button
            type="button"
            className="min-h-11 text-sm underline decoration-wood/30 underline-offset-4 focus-visible:ring-2 focus-visible:ring-wood/40 focus-visible:outline-none"
            aria-expanded={expanded}
            aria-controls="amenities-list"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Згорнути' : 'Показати всі зручності'}
          </button>
        ) : null}
      </div>
      <ul id="amenities-list" className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 lg:grid-cols-3">
        {groups.flatMap((group) => {
          const heading = Boolean(group.label) && showAmenityGroupHeading(group.items.length)
          return [
            heading ? (
              <li key={`${group.category}-heading`} className="col-span-2 list-none pt-1 lg:col-span-3">
                <h3 className="text-[0.72rem] font-medium tracking-[0.14em] uppercase text-wood/55">{group.label}</h3>
              </li>
            ) : null,
            ...group.items.map((item) => (
              <li key={item.key} className="flex min-h-11 min-w-0 items-center gap-2.5 text-sm leading-snug text-wood/85">
                <AmenityIcon iconKey={item.iconKey} className="size-5 shrink-0 text-wood/70" />
                <span className="min-w-0 break-words">{item.label}</span>
              </li>
            )),
          ]
        })}
      </ul>
    </section>
  )
}

export function AccommodationStory({ room }: { room: PublicAccommodation }) {
  const paragraphs = publicDescription(room.description).split(/\n\n/).filter(Boolean)
  const policy = stayPolicyLine(room.description) ?? `Заїзд з ${site.checkIn}. Виїзд до ${site.checkOut}.`
  const hasAmenities = (room.amenities?.length ?? 0) > 0
  return (
    <div>
      {paragraphs.length > 0 ? (
        <section className="max-w-[40rem]">
          <h2 className="font-display text-4xl leading-tight">Про помешкання</h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-wood/85">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}
      {hasAmenities ? (
        <div className={paragraphs.length > 0 ? 'mt-12' : undefined}>
          <AmenitiesSection amenities={room.amenities} />
        </div>
      ) : null}
      <section className={`max-w-[40rem] ${paragraphs.length > 0 || hasAmenities ? 'mt-12' : ''}`}>
        <h2 className="font-display text-4xl leading-tight">Заїзд і виїзд</h2>
        <p className="mt-6 text-base leading-8 text-wood/85">{policy}</p>
      </section>
    </div>
  )
}

/** Heading and story together. Detail pages place the gallery between them. */
export function AccommodationCopy({ room }: { room: PublicAccommodation }) {
  return (
    <>
      <AccommodationHeading room={room} />
      <div className="mt-6">
        <AccommodationFacts room={room} />
      </div>
      <div className="mt-10">
        <AccommodationStory room={room} />
      </div>
    </>
  )
}

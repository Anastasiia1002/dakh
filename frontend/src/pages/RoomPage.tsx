import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CatalogState } from '../components/CatalogState'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { capacityLabel, galleryImages, kindLabel, publicDescription, publicTitle } from '../lib/catalog/display'
import { accommodationBase, fictionalDetailRedirect } from '../lib/catalog/routes'
import { useAccommodation, useAccommodationList } from '../lib/catalog/useAccommodations'
import type { PublicAccommodation, PublicHotelSlug } from '../lib/publicBooking/types'

export function RoomPage({ hotel }: { hotel: PublicHotelSlug }) {
  const { slug = '' } = useParams()
  const listPath = accommodationBase(hotel)
  const decoded = decodeURIComponent(slug)

  const redirect = fictionalDetailRedirect(hotel, decoded)
  if (redirect) return <Navigate to={redirect} replace />

  return <AccommodationDetail hotel={hotel} slug={decoded} listPath={listPath} />
}

function AccommodationDetail({
  hotel,
  slug,
  listPath,
}: {
  hotel: PublicHotelSlug
  slug: string
  listPath: string
}) {
  const detail = useAccommodation(hotel, slug)
  const related = useAccommodationList(hotel)
  const [active, setActive] = useState(0)
  const room = detail.item
  const images = room ? galleryImages(room) : []
  const selected = images[active] ?? images[0]
  const others = related.items.filter((item) => item.slug !== slug)

  return (
    <article>
      {detail.status === 'ready' && room && selected ? (
        <>
          <Photo src={selected.url} alt={selected.alt || publicTitle(room.name, room.maxGuests)} className="h-[70vh] w-full" />
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-6 pt-3 sm:grid-cols-5">
            {images.map((image, index) => (
              <button key={`${image.url}-${image.sortOrder}`} type="button" onClick={() => setActive(index)} className="block">
                <Photo
                  src={image.url}
                  alt=""
                  className={`aspect-[4/3] w-full ${index === active ? 'ring-1 ring-clay' : 'opacity-70'}`}
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[40vh] bg-beige" />
      )}

      <section className="mx-auto max-w-3xl px-6 py-16">
        {detail.status === 'ready' && room ? (
          <>
            <AccommodationCopy room={room} />
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
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="font-display text-4xl">Спробуйте також</h2>
          <div className="mt-10 grid gap-12 md:grid-cols-2">
            {others.map((item) => (
              <RoomCard key={item.id} accommodation={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-6xl px-6 pb-24">
        <Link
          to={listPath}
          className="inline-block text-[0.75rem] tracking-[0.14em] uppercase underline decoration-wood/30 underline-offset-4"
        >
          {hotel === 'dakh' ? 'Усі номери' : 'Усі будинки'}
        </Link>
      </div>
    </article>
  )
}

export function AccommodationCopy({ room }: { room: PublicAccommodation }) {
  const paragraphs = publicDescription(room.description).split(/\n\n/).filter(Boolean)
  return (
    <>
      <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">{kindLabel(room.kind)}</p>
      <h1 className="mt-2 font-display text-5xl">{publicTitle(room.name, room.maxGuests)}</h1>
      <p className="mt-4 text-sm text-wood/70">{capacityLabel(room.maxGuests)}</p>
      <div className="mt-8 max-w-xl space-y-4 leading-relaxed text-wood/80">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </>
  )
}

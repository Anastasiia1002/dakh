import { lazy, Suspense, useState, type UIEvent } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { CatalogState } from '../components/CatalogState'
import { Photo } from '../components/Photo'
import { RoomCard } from '../components/RoomCard'
import { site } from '../data/catalog'
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
import type { PublicAccommodation, PublicAccommodationImage } from '../lib/publicBooking/types'

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
  const detail = useAccommodation(category, apiSlug)
  const related = useAccommodationList(category)
  const room = detail.item
  const images = room ? galleryImages(room) : []
  const others = related.items.filter((item) => item.slug !== apiSlug)
  const listPath = categoryBase(category)
  const listLabel = category === 'rooms' ? 'Кімнати' : 'Будинки'
  const title = room ? publicTitle(room.name, room.maxGuests) : ''

  return (
    <article className="overflow-x-hidden">
      {detail.status === 'ready' && room ? (
        <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
          <nav aria-label="Шлях">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-wood/70">
              <li>
                <Link to="/" className="underline decoration-wood/25 underline-offset-4 hover:text-wood">
                  Головна
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={listPath} className="underline decoration-wood/25 underline-offset-4 hover:text-wood">
                  {listLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="min-w-0 break-words text-wood">
                {title}
              </li>
            </ol>
          </nav>
          <h1 className="mt-6 max-w-4xl break-words font-display text-[2.5rem] leading-[1.08] text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </header>
      ) : (
        <div className="h-48 bg-beige" />
      )}

      {detail.status === 'ready' && room && images.length > 0 ? (
        <EditorialGallery key={room.id} images={images} title={title} />
      ) : null}

      {detail.status === 'ready' && room ? (
        <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
          <AccommodationFacts room={room} />
        </div>
      ) : null}

      <section className="mx-auto mt-8 grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:mt-14 lg:grid-cols-[minmax(0,1.86fr)_minmax(18rem,1fr)] lg:gap-14">
        {detail.status === 'ready' && room ? (
          <>
            <div className="order-2 min-w-0 lg:order-1">
              <AccommodationStory room={room} />
            </div>
            <div className="order-1 min-w-0 lg:sticky lg:top-32 lg:order-2 lg:self-start">
              {ActiveRoomBooking ? (
                <Suspense fallback={<p className="bg-beige px-6 py-8 text-base text-wood/70">Завантажуємо дати…</p>}>
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
              <RoomCard key={item.id} accommodation={item} />
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

export function AccommodationStory({ room }: { room: PublicAccommodation }) {
  const paragraphs = publicDescription(room.description).split(/\n\n/).filter(Boolean)
  const policy = stayPolicyLine(room.description) ?? `Заїзд з ${site.checkIn}. Виїзд до ${site.checkOut}.`
  return (
    <div className="max-w-[40rem]">
      {paragraphs.length > 0 ? (
        <section>
          <h2 className="font-display text-4xl leading-tight">Про помешкання</h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-wood/85">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}
      <section className={paragraphs.length > 0 ? 'mt-12' : undefined}>
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

function EditorialGallery({ images, title }: { images: PublicAccommodationImage[]; title: string }) {
  const [active, setActive] = useState(0)
  const index = Math.min(active, images.length - 1)
  const selected = images[index]
  if (!selected) return null
  const support = images
    .map((image, imageIndex) => ({ image, imageIndex }))
    .filter((item) => item.imageIndex !== index)
    .slice(0, 2)
  const shown = new Set([index, ...support.map((item) => item.imageIndex)])
  const rest = images
    .map((image, imageIndex) => ({ image, imageIndex }))
    .filter((item) => !shown.has(item.imageIndex))

  function onStripScroll(event: UIEvent<HTMLDivElement>) {
    const node = event.currentTarget
    const width = node.clientWidth
    if (width <= 0) return
    const next = Math.round(node.scrollLeft / width)
    if (next >= 0 && next < images.length) setActive((current) => (current === next ? current : next))
  }

  return (
    <section className="mt-8" aria-label="Фото помешкання">
      <div className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto md:hidden" onScroll={onStripScroll}>
        {images.map((image, imageIndex) => (
          <div key={`${image.url}-${image.sortOrder}`} className="w-full shrink-0 basis-full snap-center">
            <Photo
              src={image.url}
              alt={image.alt || title}
              priority={imageIndex === 0}
              className="aspect-[4/3] max-h-[24rem] w-full"
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <p className="mt-3 text-center text-sm text-wood/70 md:hidden">
          {index + 1} / {images.length}
        </p>
      ) : null}

      <div
        className={`mx-auto hidden max-w-6xl items-stretch gap-3 px-6 md:grid ${support.length > 0 ? 'md:grid-cols-[minmax(0,1.7fr)_minmax(11rem,0.85fr)]' : ''}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden lg:aspect-[5/4]">
          <Photo
            src={selected.url}
            alt={selected.alt || title}
            priority
            className="absolute inset-0 h-full w-full"
          />
        </div>
        {support.length > 0 ? (
          <div className={`grid min-h-0 gap-3 ${support.length > 1 ? 'grid-rows-2' : 'grid-rows-1'}`}>
            {support.map(({ image, imageIndex }) => (
              <button
                key={`${image.url}-${image.sortOrder}`}
                type="button"
                onClick={() => setActive(imageIndex)}
                className="relative min-h-0 overflow-hidden text-left"
                aria-label={image.alt || `Показати фото ${imageIndex + 1}`}
              >
                <Photo src={image.url} alt="" className="absolute inset-0 h-full w-full" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {rest.length > 0 ? (
        <div className="mx-auto mt-3 hidden max-w-6xl grid-cols-4 gap-3 px-6 md:grid">
          {rest.map(({ image, imageIndex }) => (
            <button
              key={`rest-${image.url}-${image.sortOrder}`}
              type="button"
              onClick={() => setActive(imageIndex)}
              aria-label={image.alt || `Фото ${imageIndex + 1}`}
              className="block overflow-hidden"
            >
              <Photo src={image.url} alt="" className="aspect-[3/2] w-full" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

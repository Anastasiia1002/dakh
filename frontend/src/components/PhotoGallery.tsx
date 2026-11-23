import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import { Photo } from './Photo'

type GalleryImage = { url: string; alt: string }

const SWIPE_PX = 48

export function PhotoGallery({
  images,
  lightboxImages,
  title,
}: {
  images: readonly GalleryImage[]
  lightboxImages?: readonly GalleryImage[]
  title: string
}) {
  const photos = images.filter((image) => image.url)
  const lightbox = (lightboxImages ?? photos).filter((image) => image.url)
  const headingId = useId()
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const count = photos.length
  const lightCount = lightbox.length
  const safeActive = count === 0 ? 0 : Math.min(active, count - 1)
  const current = photos[safeActive]
  const many = count > 1

  const openAt = useCallback(
    (index: number, from: HTMLElement | null) => {
      if (lightCount === 0) return
      opener.current = from
      setActive(Math.min(Math.max(0, index), lightCount - 1))
      setOpen(true)
    },
    [lightCount],
  )

  const close = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => opener.current?.focus())
  }, [])

  const step = useCallback(
    (delta: number) => {
      const total = open ? lightCount : count
      if (total <= 1) return
      setActive((index) => (index + delta + total) % total)
    },
    [count, lightCount, open],
  )

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [close, open, step])

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!many && lightCount <= 1) return
    swipe.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!swipe.current) return
    const dx = event.clientX - swipe.current.x
    const dy = event.clientY - swipe.current.y
    swipe.current = null
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
    step(dx < 0 ? 1 : -1)
  }

  if (!current) return null

  return (
    <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6" aria-labelledby={headingId}>
      <div className="flex items-end justify-between gap-4">
        <h2 id={headingId} className="font-display text-3xl text-wood sm:text-4xl">
          Фото
        </h2>
        {many ? (
          <p className="text-sm text-wood/60">
            {safeActive + 1} / {count}
          </p>
        ) : null}
      </div>
      <div className="mt-4">
        <div className="relative overflow-hidden bg-beige" style={{ aspectRatio: '3 / 2' }}>
          <button
            type="button"
            className="absolute inset-0 block h-full w-full focus-visible:ring-2 focus-visible:ring-clay focus-visible:outline-none"
            aria-label={`Відкрити фото ${safeActive + 1} з ${count}`}
            onClick={(event) => openAt(safeActive, event.currentTarget)}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <Photo
              src={current.url}
              alt={current.alt || title}
              tone={false}
              sizes="(min-width: 1280px) 1120px, 100vw"
              className="h-full w-full object-contain"
            />
          </button>
          {many ? (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-linen/90 text-wood"
                aria-label="Попереднє фото"
                onClick={() => step(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-linen/90 text-wood"
                aria-label="Наступне фото"
                onClick={() => step(1)}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
        {many ? (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {photos.map((image, index) => (
              <li key={`${image.url}-${index}`} className="shrink-0">
                <button
                  type="button"
                  aria-current={index === safeActive ? 'true' : undefined}
                  aria-label={`Фото ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={`block h-16 w-24 overflow-hidden border ${
                    index === safeActive ? 'border-clay' : 'border-wood/15'
                  }`}
                >
                  <Photo
                    src={image.url}
                    alt=""
                    tone={false}
                    sizes="96px"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {open && lightbox[safeActive] ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Перегляд фото"
          className="fixed inset-0 z-[80] flex flex-col bg-wood/95 text-linen"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm">
              {safeActive + 1} / {lightCount}
            </p>
            <button
              ref={closeButton}
              type="button"
              className="min-h-11 px-3 text-sm underline decoration-linen/40 underline-offset-4"
              onClick={close}
            >
              Закрити
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8">
            {lightCount > 1 ? (
              <button
                type="button"
                className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center bg-linen/15"
                aria-label="Попереднє фото"
                onClick={() => step(-1)}
              >
                ‹
              </button>
            ) : null}
            <img
              src={lightbox[safeActive].url}
              alt={lightbox[safeActive].alt || title}
              className="max-h-full max-w-full object-contain"
            />
            {lightCount > 1 ? (
              <button
                type="button"
                className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center bg-linen/15"
                aria-label="Наступне фото"
                onClick={() => step(1)}
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

import { useEffect, useId, useRef, useState, type KeyboardEvent, type UIEvent } from 'react'
import type { PublicAccommodationImage } from '../lib/publicBooking/types'
import { Photo } from './Photo'

export function PhotoGallery({
  images,
  title,
  lightboxImages,
}: {
  images: PublicAccommodationImage[]
  title: string
  lightboxImages?: PublicAccommodationImage[]
}) {
  const frames = lightboxImages ?? images
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const index = Math.min(active, Math.max(0, frames.length - 1))
  const selected = frames[index]
  const labelId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowRight') setActive((current) => (current + 1) % frames.length)
      if (event.key === 'ArrowLeft') setActive((current) => (current === 0 ? frames.length - 1 : current - 1))
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [frames.length, open])

  if (!selected) return null

  function go(delta: number) {
    setActive((current) => {
      const next = current + delta
      if (next < 0) return frames.length - 1
      if (next >= frames.length) return 0
      return next
    })
  }

  function onStripScroll(event: UIEvent<HTMLDivElement>) {
    const node = event.currentTarget
    const width = node.clientWidth
    if (width <= 0) return
    const next = Math.round(node.scrollLeft / width)
    if (next >= 0 && next < images.length) {
      const slide = images[next]
      const frameIndex = frames.findIndex((image) => image.url === slide.url)
      setActive((current) => (frameIndex === current || frameIndex < 0 ? current : frameIndex))
    }
  }

  function onDialogKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') {
      const focusable = event.currentTarget.querySelectorAll<HTMLElement>('button')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  const featured = images[0]
  const rest = images.slice(1)

  function openFrame(image: PublicAccommodationImage) {
    const frameIndex = frames.findIndex((item) => item.url === image.url)
    setActive(frameIndex < 0 ? 0 : frameIndex)
    setOpen(true)
  }

  return (
    <section className="mt-6 md:mt-8" aria-label="Фото помешкання">
      <div className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto md:hidden" onScroll={onStripScroll}>
        {images.map((image) => (
          <button
            key={`${image.url}-${image.sortOrder}`}
            type="button"
            className="w-full shrink-0 basis-full snap-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            onClick={() => openFrame(image)}
          >
            <Photo src={image.url} alt={image.alt || title} className="aspect-[4/3] max-h-[24rem] w-full" />
          </button>
        ))}
      </div>
      {images.length > 1 ? (
        <p className="mt-3 text-center text-sm text-wood/70 md:hidden">
          {Math.max(1, images.findIndex((image) => image.url === selected.url) + 1)} / {images.length}
        </p>
      ) : null}

      {featured ? (
        <div
          className={`mx-auto hidden max-w-6xl gap-3 px-4 sm:px-6 md:grid ${rest.length > 0 ? 'md:grid-cols-[minmax(0,1.7fr)_minmax(11rem,0.85fr)]' : ''}`}
        >
          <button
            type="button"
            className="relative aspect-[5/4] overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            onClick={() => openFrame(featured)}
            aria-label={`Відкрити фото ${frames.findIndex((item) => item.url === featured.url) + 1} з ${frames.length}`}
          >
            <Photo src={featured.url} alt={featured.alt || title} className="absolute inset-0 h-full w-full" />
          </button>
          {rest.length > 0 ? (
            <div className={`grid min-h-0 gap-3 ${rest.length > 1 ? 'grid-rows-2' : 'grid-rows-1'}`}>
              {rest.slice(0, 2).map((image, restIndex) => (
                <button
                  key={`${image.url}-${image.sortOrder}`}
                  type="button"
                  onClick={() => openFrame(image)}
                  className="relative min-h-0 overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  aria-label={image.alt || `Показати фото ${restIndex + 2}`}
                >
                  <Photo src={image.url} alt="" className="absolute inset-0 h-full w-full" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {rest.length > 2 ? (
        <div className="mx-auto mt-3 hidden max-w-6xl grid-cols-4 gap-3 px-4 sm:px-6 md:grid">
          {rest.slice(2).map((image, restIndex) => (
            <button
              key={`rest-${image.url}-${image.sortOrder}`}
              type="button"
              onClick={() => openFrame(image)}
              aria-label={image.alt || `Фото ${restIndex + 3}`}
              className="block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <Photo src={image.url} alt="" className="aspect-[3/2] w-full" />
            </button>
          ))}
        </div>
      ) : null}

      {frames.length > 1 ? (
        <div className="mx-auto mt-4 hidden max-w-6xl items-center justify-between px-4 sm:px-6 md:flex">
          <p className="text-sm text-wood/70">
            {index + 1} / {frames.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 min-w-11 border border-wood/15 px-3 text-sm text-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              aria-label="Попереднє фото"
              onClick={() => go(-1)}
            >
              Назад
            </button>
            <button
              type="button"
              className="min-h-11 min-w-11 border border-wood/15 px-3 text-sm text-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              aria-label="Наступне фото"
              onClick={() => go(1)}
            >
              Далі
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          className="fixed inset-0 z-50 flex flex-col bg-wood/92 text-linen"
          onKeyDown={onDialogKey}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <p id={labelId} className="text-sm text-linen/80">
              {index + 1} / {frames.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              className="min-h-11 px-3 text-[0.72rem] font-semibold tracking-[0.14em] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-linen"
              onClick={() => setOpen(false)}
            >
              Закрити
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8">
            {frames.length > 1 ? (
              <button
                type="button"
                className="absolute left-3 z-10 min-h-11 min-w-11 border border-linen/30 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-linen"
                aria-label="Попереднє фото"
                onClick={() => go(-1)}
              >
                Назад
              </button>
            ) : null}
            <Photo
              src={selected.url}
              alt={selected.alt || title}
              sizes="100vw"
              fit="contain"
              className="max-h-[80svh] w-auto max-w-full"
            />
            {frames.length > 1 ? (
              <button
                type="button"
                className="absolute right-3 z-10 min-h-11 min-w-11 border border-linen/30 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-linen"
                aria-label="Наступне фото"
                onClick={() => go(1)}
              >
                Далі
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

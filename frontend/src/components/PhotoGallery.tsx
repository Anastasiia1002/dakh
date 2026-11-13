import { useEffect, useId, useRef, useState, type KeyboardEvent, type UIEvent } from 'react'
import type { PublicAccommodationImage } from '../lib/publicBooking/types'
import { Photo } from './Photo'

export function PhotoGallery({ images, title }: { images: PublicAccommodationImage[]; title: string }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const index = Math.min(active, Math.max(0, images.length - 1))
  const selected = images[index]
  const labelId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowRight') setActive((current) => (current + 1) % images.length)
      if (event.key === 'ArrowLeft') setActive((current) => (current === 0 ? images.length - 1 : current - 1))
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [images.length, open])

  if (!selected) return null

  function go(delta: number) {
    setActive((current) => {
      const next = current + delta
      if (next < 0) return images.length - 1
      if (next >= images.length) return 0
      return next
    })
  }

  function onStripScroll(event: UIEvent<HTMLDivElement>) {
    const node = event.currentTarget
    const width = node.clientWidth
    if (width <= 0) return
    const next = Math.round(node.scrollLeft / width)
    if (next >= 0 && next < images.length) setActive((current) => (current === next ? current : next))
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

  const rest = images.map((image, imageIndex) => ({ image, imageIndex })).filter((item) => item.imageIndex !== index)

  return (
    <section className="mt-6 md:mt-8" aria-label="Фото помешкання">
      <div className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto md:hidden" onScroll={onStripScroll}>
        {images.map((image, imageIndex) => (
          <button
            key={`${image.url}-${image.sortOrder}`}
            type="button"
            className="w-full shrink-0 basis-full snap-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            onClick={() => {
              setActive(imageIndex)
              setOpen(true)
            }}
          >
            <Photo
              src={image.url}
              alt={image.alt || title}
              priority={imageIndex === 0}
              className="aspect-[4/3] max-h-[24rem] w-full"
            />
          </button>
        ))}
      </div>
      {images.length > 1 ? (
        <p className="mt-3 text-center text-sm text-wood/70 md:hidden">
          {index + 1} / {images.length}
        </p>
      ) : null}

      <div
        className={`mx-auto hidden max-w-6xl gap-3 px-6 md:grid ${rest.length > 0 ? 'md:grid-cols-[minmax(0,1.7fr)_minmax(11rem,0.85fr)]' : ''}`}
      >
        <button
          type="button"
          className="relative aspect-[5/4] overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          onClick={() => setOpen(true)}
          aria-label={`Відкрити фото ${index + 1} з ${images.length}`}
        >
          <Photo src={selected.url} alt={selected.alt || title} priority className="absolute inset-0 h-full w-full" />
        </button>
        {rest.length > 0 ? (
          <div className={`grid min-h-0 gap-3 ${rest.length > 1 ? 'grid-rows-2' : 'grid-rows-1'}`}>
            {rest.slice(0, 2).map(({ image, imageIndex }) => (
              <button
                key={`${image.url}-${image.sortOrder}`}
                type="button"
                onClick={() => {
                  setActive(imageIndex)
                  setOpen(true)
                }}
                className="relative min-h-0 overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                aria-label={image.alt || `Показати фото ${imageIndex + 1}`}
              >
                <Photo src={image.url} alt="" className="absolute inset-0 h-full w-full" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {rest.length > 2 ? (
        <div className="mx-auto mt-3 hidden max-w-6xl grid-cols-4 gap-3 px-6 md:grid">
          {rest.slice(2).map(({ image, imageIndex }) => (
            <button
              key={`rest-${image.url}-${image.sortOrder}`}
              type="button"
              onClick={() => {
                setActive(imageIndex)
                setOpen(true)
              }}
              aria-label={image.alt || `Фото ${imageIndex + 1}`}
              className="block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <Photo src={image.url} alt="" className="aspect-[3/2] w-full" />
            </button>
          ))}
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="mx-auto mt-4 hidden max-w-6xl items-center justify-between px-6 md:flex">
          <p className="text-sm text-wood/70">
            {index + 1} / {images.length}
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
              {index + 1} / {images.length}
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
            {images.length > 1 ? (
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
              priority
              sizes="100vw"
              fit="contain"
              className="max-h-[80svh] w-auto max-w-full"
            />
            {images.length > 1 ? (
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

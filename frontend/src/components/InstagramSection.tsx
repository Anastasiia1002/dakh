import { images, site } from '../data/catalog'
import { Photo } from './Photo'

const instagramHref = site.instagram

export function InstagramSection() {
  if (!instagramHref || /^https:\/\/(?:www\.)?instagram\.com\/?$/.test(instagramHref)) return null

  return (
    <section className="photo-grain relative min-h-[60vh]" aria-labelledby="instagram-heading">
      <Photo
        src={images.pottery}
        alt="Зал DAKH із видом на гори"
        tone={false}
        className="absolute inset-0 h-full w-full"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-wood/40" />
      <div className="relative flex min-h-[60vh] flex-col items-start justify-end gap-5 px-6 py-20 md:px-16">
        <p className="kicker text-[0.68rem] text-linen/80">Instagram</p>
        <h2 id="instagram-heading" className="-rotate-1 font-display text-5xl text-linen md:text-6xl">
          @dakh.myhovo
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-linen/90">
          Світло, стіл і гори — у стрічці готелю в Мигові. Пости не підвантажуємо сюди: відкрийте профіль.
        </p>
        <a
          href={instagramHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center bg-linen px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-linen"
        >
          Переглянути Instagram
        </a>
      </div>
    </section>
  )
}

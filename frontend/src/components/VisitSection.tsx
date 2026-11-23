import { site } from '../data/catalog'
import { instagramProfileEmbedSrc } from '../lib/siteSocials'
import { siteLink } from '../lib/siteChrome'
import { LocationMap } from './LocationMap'

const linkClass = `inline-flex min-h-11 items-center ${siteLink}`

export function VisitSection() {
  const instagramHref = site.instagram
  const embedSrc = instagramProfileEmbedSrc(instagramHref)

  return (
    <section className="border-t border-wood/10" aria-labelledby="visit-heading">
      <div className="mx-auto grid max-w-6xl items-start gap-16 px-6 py-28 lg:grid-cols-2">
        <div>
          <p className="kicker text-clay">{site.city}</p>
          <h2 id="visit-heading" className="mt-3 font-display text-4xl leading-tight">
            У тихому куточку Карпат
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-wood/80">
            {site.address}. Гори близько, місто — коли захочете. Якщо шукаєте тишу — вона тут.
          </p>
          <LocationMap className="mt-6 min-h-80 md:min-h-[28rem]" />
          <div className="mt-4 flex flex-wrap gap-x-6">
            <a href={site.map.place} target="_blank" rel="noreferrer" className={linkClass}>
              {site.address}
            </a>
            <a href={site.map.directions} target="_blank" rel="noreferrer" className={linkClass}>
              Прокласти маршрут
            </a>
          </div>
        </div>

        {embedSrc ? (
          <div>
            <p className="kicker text-clay">Instagram</p>
            <h2 className="mt-3 font-display text-4xl leading-tight">@dakh.myhovo</h2>
            <p className="mt-5 text-sm leading-relaxed text-wood/80">
              Останні дописи зі стрічки готелю в Мигові — так, як їх показує Instagram.
            </p>
            <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-wood/10 bg-beige shadow-[0_24px_50px_rgba(91,56,43,0.08)]">
              <iframe
                title="Останні дописи Instagram @dakh.myhovo"
                src={embedSrc}
                className="h-[540px] w-full bg-linen"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="encrypted-media; clipboard-write"
              />
            </div>
            <a href={instagramHref} target="_blank" rel="noreferrer" className={`${linkClass} mt-4`}>
              Переглянути Instagram
            </a>
          </div>
        ) : null}
      </div>
    </section>
  )
}

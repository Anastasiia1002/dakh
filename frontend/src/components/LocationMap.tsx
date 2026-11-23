import { site } from '../data/catalog'

export function LocationMap({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.6rem] border border-wood/10 shadow-[0_24px_50px_rgba(91,56,43,0.08)] ${className}`.trim()}>
      <iframe
        title="DAKH, вул. Солонецька, 2-И, с. Мигове"
        src={site.map.embed}
        className="pointer-events-none absolute inset-0 h-full w-full"
        loading="lazy"
      />
      <a
        href={site.map.directions}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0"
        aria-label="Прокласти маршрут до DAKH у Google Maps"
      />
    </div>
  )
}

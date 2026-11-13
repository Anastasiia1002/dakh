import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { heroPreload, listingHeroPreload } from '../lib/localPhoto'
import { canonicalUrl, hotelJsonLd, seoForPath } from '../lib/seo'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let node = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null
  if (!node) {
    const tag = selector.startsWith('link') || attributes.rel ? 'link' : 'meta'
    node = document.createElement(tag) as HTMLMetaElement | HTMLLinkElement
    document.head.appendChild(node)
  }
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value)
  }
}

export function DocumentHead() {
  const { pathname } = useLocation()
  const seo = seoForPath(pathname)
  const canonical = canonicalUrl(pathname)

  useEffect(() => {
    document.title = seo.title
    upsertMeta('meta[name="description"]', { name: 'description', content: seo.description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: seo.index ? 'index,follow' : 'noindex,nofollow' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    if (canonical) {
      upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical })
      upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    }
    let json = document.getElementById('dakh-hotel-jsonld')
    if (!json) {
      json = document.createElement('script')
      json.id = 'dakh-hotel-jsonld'
      json.setAttribute('type', 'application/ld+json')
      document.head.appendChild(json)
    }
    json.textContent = JSON.stringify(hotelJsonLd())
    const existing = document.getElementById('dakh-hero-preload')
    const listing = seo.path === '/rooms' ? 'rooms' : seo.path === '/houses' ? 'houses' : null
    const preload =
      seo.path === '/'
        ? heroPreload(import.meta.env.BASE_URL ?? '/')
        : listing
          ? listingHeroPreload(listing, import.meta.env.BASE_URL ?? '/')
          : null
    if (preload) {
      upsertMeta('link#dakh-hero-preload', {
        id: 'dakh-hero-preload',
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        href: preload.href,
        imagesrcset: preload.imagesrcset,
        imagesizes: preload.imagesizes,
        fetchpriority: 'high',
      })
    } else if (existing) {
      existing.remove()
    }
  }, [canonical, seo.description, seo.index, seo.path, seo.title])

  return null
}

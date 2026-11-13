export const LOCAL_PHOTO_WIDTHS = [800, 1280, 1920] as const

const LOCAL_JPEG = /^(.*\/images\/)([^/?#]+)\.(jpe?g)$/i

export function localWebpSrcSet(src: string) {
  const match = src.match(LOCAL_JPEG)
  if (!match) return undefined
  const [, dir, stem] = match
  return LOCAL_PHOTO_WIDTHS.map((width) => `${dir}${stem}-${width}.webp ${width}w`).join(', ')
}

function webpPreload(stem: string, base: string) {
  const root = base.endsWith('/') ? base : `${base}/`
  const dir = `${root}images/`
  return {
    href: `${dir}${stem}-800.webp`,
    imagesrcset: LOCAL_PHOTO_WIDTHS.map((width) => `${dir}${stem}-${width}.webp ${width}w`).join(', '),
    imagesizes: '100vw',
  }
}

export function heroPreload(base: string) {
  return webpPreload('dakh-facade-night', base)
}

export function listingHeroStem(category: 'rooms' | 'houses') {
  return category === 'houses' ? 'dakh-dining' : 'dakh-lounge'
}

export function listingHeroPreload(category: 'rooms' | 'houses', base: string) {
  return webpPreload(listingHeroStem(category), base)
}

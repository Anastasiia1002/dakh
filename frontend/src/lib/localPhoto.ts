export const LOCAL_PHOTO_WIDTHS = [800, 1280, 1920] as const

const LOCAL_JPEG = /^(.*\/images\/)([^/?#]+)\.(jpe?g)$/i

export function localWebpSrcSet(src: string) {
  const match = src.match(LOCAL_JPEG)
  if (!match) return undefined
  const [, dir, stem] = match
  return LOCAL_PHOTO_WIDTHS.map((width) => `${dir}${stem}-${width}.webp ${width}w`).join(', ')
}

export function heroPreload(base: string) {
  const root = base.endsWith('/') ? base : `${base}/`
  const dir = `${root}images/`
  return {
    href: `${dir}dakh-facade-night-800.webp`,
    imagesrcset: LOCAL_PHOTO_WIDTHS.map((width) => `${dir}dakh-facade-night-${width}.webp ${width}w`).join(', '),
    imagesizes: '100vw',
  }
}

import { useEffect, useState } from 'react'
import { catalogCoverHref, catalogCoverSrcSet, localWebpHref, localWebpSrcSet } from '../lib/localPhoto'

type Props = {
  src: string
  alt: string
  className?: string
  tone?: boolean
  /** First visible cover or the open gallery image. Everything else waits. */
  priority?: boolean
  sizes?: string
  fit?: 'cover' | 'contain'
  /** Public slug whose sized WebP covers were written at build time. */
  coverKey?: string
}

function unsplashSrcSet(src: string) {
  if (!src.includes('images.unsplash.com')) return undefined
  try {
    return [800, 1280, 1920]
      .map((width) => {
        const url = new URL(src)
        url.searchParams.set('auto', 'format')
        url.searchParams.set('fit', 'crop')
        url.searchParams.set('w', String(width))
        url.searchParams.set('q', '75')
        return `${url.toString()} ${width}w`
      })
      .join(', ')
  } catch {
    return undefined
  }
}

export function Photo({
  src,
  alt,
  className = '',
  tone = true,
  priority = false,
  sizes,
  fit = 'cover',
  coverKey,
}: Props) {
  const [failed, setFailed] = useState(false)
  const [skipBuiltCover, setSkipBuiltCover] = useState(false)
  const builtCover = Boolean(import.meta.env?.PROD && coverKey && !skipBuiltCover)
  const webpSrcSet =
    localWebpSrcSet(src) ?? (builtCover && coverKey ? catalogCoverSrcSet(coverKey, import.meta.env?.BASE_URL ?? '/') : undefined)
  const webpSrc =
    localWebpHref(src) ?? (builtCover && coverKey ? catalogCoverHref(coverKey, import.meta.env?.BASE_URL ?? '/') : undefined)
  const jpegSrcSet = webpSrcSet ? undefined : unsplashSrcSet(src)
  const srcSet = webpSrcSet ?? jpegSrcSet
  const layoutSizes = srcSet ? (sizes ?? '(max-width: 768px) 100vw, 72vw') : undefined

  useEffect(() => {
    setFailed(false)
    setSkipBuiltCover(false)
  }, [src, coverKey])

  if (failed) {
    return <div className={`bg-beige ${className}`} role="img" aria-label={alt || 'Фото недоступне'} />
  }

  return (
    <img
      src={webpSrc ?? src}
      srcSet={srcSet}
      sizes={layoutSizes}
      alt={alt}
      decoding={priority ? 'sync' : 'async'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={`${tone ? 'photo-tone' : ''} ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
      onError={() => {
        if (builtCover) {
          setSkipBuiltCover(true)
          return
        }
        setFailed(true)
      }}
    />
  )
}

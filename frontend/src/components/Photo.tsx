import { useEffect, useState } from 'react'
import { localWebpSrcSet } from '../lib/localPhoto'

type Props = {
  src: string
  alt: string
  className?: string
  tone?: boolean
  /** First visible cover or the open gallery image. Everything else waits. */
  priority?: boolean
  sizes?: string
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

export function Photo({ src, alt, className = '', tone = true, priority = false, sizes }: Props) {
  const [failed, setFailed] = useState(false)
  const webpSrcSet = localWebpSrcSet(src)
  const jpegSrcSet = webpSrcSet ? undefined : unsplashSrcSet(src)
  const srcSet = webpSrcSet ?? jpegSrcSet
  const layoutSizes = srcSet ? (sizes ?? '(max-width: 768px) 100vw, 72vw') : undefined

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (failed) {
    return <div className={`bg-beige ${className}`} role="img" aria-label={alt || 'Фото недоступне'} />
  }

  const image = (
    <img
      src={src}
      srcSet={jpegSrcSet}
      sizes={layoutSizes}
      alt={alt}
      decoding={priority ? 'sync' : 'async'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={`${tone ? 'photo-tone' : ''} object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )

  if (!webpSrcSet) return image

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet} sizes={layoutSizes} />
      {image}
    </picture>
  )
}

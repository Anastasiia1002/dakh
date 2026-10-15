import { useEffect, useState } from 'react'

type Props = {
  src: string
  alt: string
  className?: string
  tone?: boolean
}

export function Photo({ src, alt, className = '', tone = true }: Props) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (failed) {
    return <div className={`bg-beige ${className}`} role="img" aria-label={alt || 'Фото недоступне'} />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${tone ? 'photo-tone' : ''} object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

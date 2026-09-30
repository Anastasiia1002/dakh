type Props = {
  src: string
  alt: string
  className?: string
  tone?: boolean
}

export function Photo({ src, alt, className = '', tone = true }: Props) {
  return (
    <img src={src} alt={alt} className={`${tone ? 'photo-tone' : ''} object-cover ${className}`} />
  )
}

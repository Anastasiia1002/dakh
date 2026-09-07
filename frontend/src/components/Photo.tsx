type Props = {
  src: string
  alt: string
  className?: string
}

export function Photo({ src, alt, className = '' }: Props) {
  return <img src={src} alt={alt} className={`photo-tone object-cover ${className}`} />
}

/** Public path slugs that GitHub Pages must serve as real HTML files. */
export const KNOWN_PUBLIC_ROOM_SLUGS = ['dakh-room-14-1', 'dakh-room-14-2', 'dakh-room-14-3'] as const

export const KNOWN_PUBLIC_HOUSE_SLUGS = [
  'house-7',
  'house-8',
  'house-9',
  'house-10',
  'house-11',
  'house-12',
] as const

export function isKnownPublicRoomSlug(slug: string) {
  return (KNOWN_PUBLIC_ROOM_SLUGS as readonly string[]).includes(slug)
}

export function isKnownPublicHouseSlug(slug: string) {
  return (KNOWN_PUBLIC_HOUSE_SLUGS as readonly string[]).includes(slug)
}

export function knownDetailPaths() {
  return [
    ...KNOWN_PUBLIC_ROOM_SLUGS.map((slug) => `/rooms/${slug}`),
    ...KNOWN_PUBLIC_HOUSE_SLUGS.map((slug) => `/houses/${slug}`),
  ]
}

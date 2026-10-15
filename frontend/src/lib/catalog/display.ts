import type { PublicAccommodation, PublicAccommodationImage } from '../publicBooking/types'

const PROMOTIONAL_LINE =
  /%|даруємо|вигідн|знижк|спеціальн\p{L}*\s+умов|тривалого проживання/iu

/** Guest-facing description. The stored API text stays intact; unverified offers are not rendered. */
export function publicDescription(description: string): string {
  return description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !PROMOTIONAL_LINE.test(line))
    .join('\n\n')
}

export function publicSummary(description: string): string {
  const [first = ''] = publicDescription(description).split(/\n\n/)
  return first
}

const TITLE_CAPACITY_PARENS = /\(\s*до\s+(\d+)\s+гост\p{L}*\s*\)/giu
const TITLE_CAPACITY = /до\s+(\d+)\s+гост\p{L}*/giu

/**
 * Visible title. The API name is unchanged.
 * A "до N гостей" phrase stays when N is maxGuests and is omitted when it disagrees.
 */
export function publicTitle(name: string, maxGuests: number): string {
  const dropIfContradictory = (phrase: string, digits: string) => (Number(digits) === maxGuests ? phrase : '')
  return name
    .replace(TITLE_CAPACITY_PARENS, dropIfContradictory)
    .replace(TITLE_CAPACITY, dropIfContradictory)
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function kindLabel(kind: PublicAccommodation['kind']): string {
  return kind === 'COTTAGE' ? 'Будинок' : 'Номер'
}

export function capacityLabel(maxGuests: number): string {
  const mod10 = maxGuests % 10
  const mod100 = maxGuests % 100
  const noun = mod10 === 1 && mod100 !== 11 ? 'гостя' : 'гостей'
  return `До ${maxGuests} ${noun}`
}

/** Cover first, then the rest by sortOrder, without repeating the cover URL. */
export function galleryImages(accommodation: PublicAccommodation): PublicAccommodationImage[] {
  const rest = [...accommodation.images]
    .filter((image) => image.url !== accommodation.cover.url)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.url.localeCompare(right.url))
  return [accommodation.cover, ...rest]
}

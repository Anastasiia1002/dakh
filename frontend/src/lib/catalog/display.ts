import type { PublicAccommodation, PublicAccommodationImage } from '../publicBooking/types'

const PROMOTIONAL_LINE =
  /%|даруємо|вигідн|знижк|спеціальн\p{L}*\s+умов|тривалого проживання/iu

/** Exact stay sentence written by the catalog import from check-in and check-out fields. */
const STAY_POLICY_LINE = /^Заїзд з \d{2}:\d{2} до \d{2}:\d{2}\. Виїзд до \d{2}:\d{2}\.$/u

const INTERNAL_LABEL = /^(?:джерело|спальні|зручності)\s*:/iu

const INTERNAL_NOTE =
  /standardGuestsNumber|minDaysRestriction|cancellationPolicy|неперевірена розбіжність|guestsMax/iu

function catalogLines(description: string): string[] {
  return description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/**
 * One stored line, with import labels removed.
 * Returns null when the line is an offer, a migration note, or only an internal label.
 * A BookMeNow status sentence keeps the guest words that follow it when that status is enabled.
 */
function guestFacingLine(line: string): string | null {
  if (PROMOTIONAL_LINE.test(line) || STAY_POLICY_LINE.test(line)) return null
  if (INTERNAL_LABEL.test(line) || INTERNAL_NOTE.test(line)) return null
  const pets = line.match(/^Тварини у формі BookMeNow увімкнені\.\s*(.*)$/iu)
  if (pets) return pets[1].trim() || null
  const children = line.match(/^Діти у формі BookMeNow увімкнені\.\s*(.*)$/iu)
  if (children) return children[1].trim() || null
  if (/bookmenow/i.test(line)) return null
  return line
}

function uniqueGuestLines(lines: string[]): string[] {
  const seen = new Set<string>()
  const kept: string[] = []
  for (const line of lines) {
    const key = line.replace(/\s+/g, ' ').toLocaleLowerCase('uk')
    if (seen.has(key)) continue
    seen.add(key)
    kept.push(line)
  }
  return kept
}

/** Guest-facing description. The stored API text stays intact; notes and unverified offers are not rendered. */
export function publicDescription(description: string): string {
  return uniqueGuestLines(
    catalogLines(description)
      .map(guestFacingLine)
      .filter((line): line is string => line !== null),
  ).join('\n\n')
}

/** Per-stay check-in sentence when the catalog text contains one. Otherwise the page uses the hotel times. */
export function stayPolicyLine(description: string): string | null {
  return catalogLines(description).find((line) => STAY_POLICY_LINE.test(line)) ?? null
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

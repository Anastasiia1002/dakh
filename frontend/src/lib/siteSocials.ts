import { site } from '../data/catalog'

export type OfficialSocial = {
  label: string
  href: string
}

const SOCIAL_HOSTS: Record<string, string> = {
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'fb.com': 'Facebook',
  't.me': 'Telegram',
  'telegram.me': 'Telegram',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function isPlaceholderSocial(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const path = parsed.pathname.replace(/\/+$/, '')
    if (host === 'instagram.com' && (path === '' || path === '/')) return true
    if (host === 'facebook.com' && (path === '' || path === '/')) return true
    return false
  } catch {
    return true
  }
}

export function instagramProfileEmbedSrc(href = site.instagram) {
  const value = href?.trim()
  if (!value || isPlaceholderSocial(value)) return undefined
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'instagram.com') return undefined
    const username = parsed.pathname.split('/').filter(Boolean)[0]
    if (!username || username === 'p' || username === 'reel' || username === 'stories') return undefined
    return `https://www.instagram.com/${encodeURIComponent(username)}/embed/`
  } catch {
    return undefined
  }
}

export function officialSocials(source: Pick<typeof site, 'instagram'> = site): OfficialSocial[] {
  const candidates = [{ href: source.instagram }]
  const seen = new Set<string>()
  const items: OfficialSocial[] = []
  for (const candidate of candidates) {
    const href = candidate.href?.trim()
    if (!href || isPlaceholderSocial(href)) continue
    const host = hostOf(href)
    const label = SOCIAL_HOSTS[host]
    if (!label || seen.has(host)) continue
    seen.add(host)
    items.push({ label, href })
  }
  return items
}

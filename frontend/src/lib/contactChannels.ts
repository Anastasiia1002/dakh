import { site } from '../data/catalog'
import { officialSocials, type OfficialSocial } from './siteSocials'

export type ContactChannel = {
  id: string
  label: string
  href: string
  detail?: string
  external?: boolean
}

export function widgetPhoneDetail(href: string) {
  const digits = href.replace(/\D/g, '')
  return digits ? `+${digits}` : undefined
}

/** Phone, WhatsApp, Viber, and Telegram use the published widget number. Messenger is omitted unless configured. */
export function widgetContactChannels(
  source: Pick<typeof site, 'widgetPhoneHref' | 'whatsappHref' | 'viberHref' | 'telegramHref' | 'instagram'> = site,
): ContactChannel[] {
  const channels: ContactChannel[] = [
    { id: 'phone', label: 'Подзвонити', href: source.widgetPhoneHref, detail: widgetPhoneDetail(source.widgetPhoneHref) },
    { id: 'whatsapp', label: 'WhatsApp', href: source.whatsappHref, external: true },
    { id: 'viber', label: 'Viber', href: source.viberHref },
  ]
  if (source.telegramHref) {
    channels.push({ id: 'telegram', label: 'Telegram', href: source.telegramHref, external: true })
  }
  const socials: OfficialSocial[] = officialSocials(source)
  for (const social of socials) {
    const id = social.label.toLowerCase()
    if (channels.some((channel) => channel.id === id)) continue
    channels.push({
      id,
      label: social.label,
      href: social.href,
      external: true,
    })
  }
  return channels
}

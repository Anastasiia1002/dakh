import { site } from '../data/catalog'
import { officialSocials, type OfficialSocial } from './siteSocials'

export type ContactChannel = {
  id: string
  label: string
  href: string
  external?: boolean
}

/** Phone, WhatsApp, and Viber use the published widget number. Telegram/Messenger are omitted unless configured. */
export function widgetContactChannels(
  source: Pick<typeof site, 'widgetPhoneHref' | 'whatsappHref' | 'viberHref' | 'instagram'> = site,
): ContactChannel[] {
  const channels: ContactChannel[] = [
    { id: 'phone', label: 'Подзвонити', href: source.widgetPhoneHref },
    { id: 'whatsapp', label: 'WhatsApp', href: source.whatsappHref, external: true },
    { id: 'viber', label: 'Viber', href: source.viberHref },
  ]
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

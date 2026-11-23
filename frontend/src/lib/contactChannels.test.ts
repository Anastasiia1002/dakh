import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { widgetContactChannels } from './contactChannels'
import { site } from '../data/catalog'

describe('widget contact channels', () => {
  it('uses the published widget phone and does not invent Messenger', () => {
    const channels = widgetContactChannels()
    assert.equal(site.widgetPhoneHref, 'tel:+380938180001')
    assert.deepEqual(
      channels.map((channel) => channel.id),
      ['phone', 'whatsapp', 'viber', 'telegram', 'instagram'],
    )
    assert.equal(channels.find((channel) => channel.id === 'phone')?.href, 'tel:+380938180001')
    assert.equal(channels.find((channel) => channel.id === 'phone')?.label, 'Подзвонити')
    assert.equal(channels.find((channel) => channel.id === 'phone')?.detail, '+380938180001')
    assert.equal(channels.find((channel) => channel.id === 'whatsapp')?.href, 'https://wa.me/380938180001')
    assert.equal(
      channels.find((channel) => channel.id === 'viber')?.href,
      'viber://chat?number=%2B380938180001',
    )
    assert.equal(channels.find((channel) => channel.id === 'telegram')?.href, 'https://t.me/+380938180001')
    assert.equal(channels.find((channel) => channel.id === 'instagram')?.href, 'https://www.instagram.com/dakh.myhovo/')
    assert.equal(
      widgetContactChannels({ ...site, instagram: 'https://instagram.com/' }).some((channel) => channel.id === 'instagram'),
      false,
    )
    assert.equal(widgetContactChannels().some((channel) => channel.id === 'messenger'), false)
  })
})

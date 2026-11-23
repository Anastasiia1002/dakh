import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { QuickActions } from '../components/QuickActions'

function markup(path: string) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Layout)))
}

describe('quick actions', () => {
  it('pins a compact contact widget and leaves booking, contact form, and confirmation uncovered', () => {
    const home = markup('/')
    const rooms = markup('/rooms')
    assert.match(home, /fixed right-\[max\(0\.75rem/)
    const actions = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(QuickActions)),
    )
    assert.match(actions, /aria-label="Зв’язатися"/)
    assert.match(actions, /aria-expanded="false"/)
    assert.doesNotMatch(actions, /tel:\+380938180001/)
    const source = readFileSync(new URL('../components/QuickActions.tsx', import.meta.url), 'utf8')
    const channels = readFileSync(new URL('./contactChannels.ts', import.meta.url), 'utf8')
    const catalog = readFileSync(new URL('../data/catalog.ts', import.meta.url), 'utf8')
    assert.match(catalog, /tel:\+380938180001/)
    assert.match(catalog, /wa\.me\/380938180001/)
    assert.match(catalog, /viber:\/\/chat\?number=%2B380938180001/)
    assert.match(channels, /officialSocials/)
    assert.match(source, /Escape/)
    assert.match(source, /withStayUrl\('\/bronuvannya', stay\)/)
    assert.match(source, /function CalendarDays/)
    assert.match(source, /aria-label=\{label\}/)
    assert.match(source, /label="Забронювати"/)
    assert.match(source, /aria-label=\{open \? 'Закрити контакти' : 'Зв’язатися'\}/)
    assert.match(source, /size-11/)
    assert.match(source, /size-6/)
    assert.match(source, /safe-area-inset-bottom/)
    assert.match(source, /safe-area-inset-right/)
    assert.match(rooms, /fixed right-\[max\(0\.75rem/)
    const roomDetail = markup('/rooms/dakh-room-14-1')
    const houseDetail = markup('/houses/house-7')
    assert.equal(roomDetail.includes('fixed right-'), false)
    assert.equal(houseDetail.includes('fixed right-'), false)
    const booking = markup('/bronuvannya')
    const confirmation = markup('/bronuvannya/pidtverdzhennya/token')
    const recover = markup('/moie-bronyuvannya')
    const contact = markup('/kontakty')
    assert.equal(booking.includes('fixed right-'), false)
    assert.equal(confirmation.includes('fixed right-'), false)
    assert.equal(recover.includes('fixed right-'), false)
    assert.equal(contact.includes('fixed right-'), false)
    const layout = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8')
    const instagram = readFileSync(new URL('../components/InstagramSection.tsx', import.meta.url), 'utf8')
    assert.match(layout, /function HeaderActions/)
    assert.match(layout, />\s*Подзвонити\s*</)
    assert.match(layout, />\s*Забронювати\s*</)
    assert.match(instagram, /@dakh\.myhovo/)
    assert.match(instagram, /Переглянути Instagram/)
  })
})

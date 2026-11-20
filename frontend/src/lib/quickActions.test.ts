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
  it('pins call on public pages and leaves booking and confirmation uncovered', () => {
    const home = markup('/')
    const rooms = markup('/rooms')
    assert.match(home, /fixed right-3/)
    assert.match(renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(QuickActions))), /tel:\+380958180001/)
    assert.match(rooms, /fixed right-3/)
    const roomDetail = markup('/rooms/dakh-room-14-1')
    const houseDetail = markup('/houses/house-7')
    assert.equal(roomDetail.includes('fixed right-3'), false)
    assert.equal(houseDetail.includes('fixed right-3'), false)
    const booking = markup('/bronuvannya')
    const confirmation = markup('/bronuvannya/pidtverdzhennya/token')
    const recover = markup('/moie-bronyuvannya')
    assert.equal(booking.includes('fixed right-3'), false)
    assert.equal(confirmation.includes('fixed right-3'), false)
    assert.equal(recover.includes('fixed right-3'), false)
    const source = readFileSync(new URL('../components/QuickActions.tsx', import.meta.url), 'utf8')
    const layout = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8')
    const actions = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(QuickActions)),
    )
    assert.match(source, /Escape/)
    assert.match(source, /withStayUrl\('\/bronuvannya', stay\)/)
    assert.match(source, /function CalendarDays/)
    assert.match(source, /function Phone/)
    assert.match(source, /aria-label=\{label\}/)
    assert.match(source, /label="Забронювати"/)
    assert.match(source, /label="Подзвонити"/)
    assert.match(source, /size-11/)
    assert.match(source, /size-6/)
    assert.match(source, /group-hover:opacity-100 group-focus:opacity-100 group-focus-visible:opacity-100/)
    assert.doesNotMatch(source, /instagram\.com\/'/)
    assert.match(actions, /aria-label="Подзвонити"/)
    assert.match(actions, /tel:\+380958180001/)
    assert.match(actions, /role="tooltip"/)
    assert.match(layout, /function HeaderActions/)
    assert.match(layout, />\s*Подзвонити\s*</)
    assert.match(layout, />\s*Забронювати\s*</)
  })
})

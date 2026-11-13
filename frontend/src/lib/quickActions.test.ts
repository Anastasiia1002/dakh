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
    const booking = markup('/bronuvannya')
    const confirmation = markup('/bronuvannya/pidtverdzhennya/token')
    const recover = markup('/moie-bronyuvannya')
    assert.equal(booking.includes('fixed right-3'), false)
    assert.equal(confirmation.includes('fixed right-3'), false)
    assert.equal(recover.includes('fixed right-3'), false)
    const source = readFileSync(new URL('../components/QuickActions.tsx', import.meta.url), 'utf8')
    assert.match(source, /Escape/)
    assert.match(source, /withStayUrl\('\/bronuvannya', stay\)/)
    assert.doesNotMatch(source, /instagram\.com\/'/)
  })
})

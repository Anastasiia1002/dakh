import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from '../../components/Layout'

describe('site header', () => {
  it('keeps the full navigation behind the tablet width and reuses one menu', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Layout)))
    assert.match(html, /lg:flex/)
    assert.match(html, /lg:hidden/)
    assert.equal(html.includes('md:flex'), false)
    assert.match(html, /aria-label="Відкрити меню"/)
    assert.match(html, /aria-controls="site-menu"/)
    assert.match(html, /aria-expanded="false"/)
    const footerAt = html.indexOf('<footer')
    assert.ok(footerAt > 0)
    assert.equal(html.slice(0, footerAt).includes('/moie-bronyuvannya'), false)
    assert.equal(html.slice(0, footerAt).includes('Моє бронювання'), false)
    assert.match(html.slice(footerAt), /Моє бронювання/)
    assert.match(html.slice(footerAt), /href="\/moie-bronyuvannya"/)
    assert.equal(html.includes('id="site-menu"'), false)
  })
})

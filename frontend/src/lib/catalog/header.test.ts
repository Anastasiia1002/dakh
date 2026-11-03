import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
    assert.match(html, /aria-haspopup="true"/)
    assert.equal((html.match(/h-0\.5 w-5/g) ?? []).length, 3)
    assert.match(html, /h-11 w-11/)
    assert.equal(html.includes('h-px w-6'), false)
    const footerAt = html.indexOf('<footer')
    assert.ok(footerAt > 0)
    assert.equal(html.slice(0, footerAt).includes('/moie-bronyuvannya'), false)
    assert.equal(html.slice(0, footerAt).includes('Моє бронювання'), false)
    assert.match(html.slice(footerAt), /Моє бронювання/)
    assert.match(html.slice(footerAt), /href="\/moie-bronyuvannya"/)
    assert.equal(html.includes('id="site-menu"'), false)
    const source = readFileSync(new URL('../../components/Layout.tsx', import.meta.url), 'utf8')
    assert.match(source, /pointerdown/)
    assert.match(source, /event\.key !== 'Escape'/)
    assert.match(source, /onClick=\{\(\) => setOpen\(false\)\}/)
  })
})

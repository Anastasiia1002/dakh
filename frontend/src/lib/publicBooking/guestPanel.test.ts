import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BookingCalendar } from '../../components/BookingCalendar'
import { guestPanelFrame } from './guestPanel'

describe('guest selector frame', () => {
  it('stays inside narrow and right-edge viewports', () => {
    for (const width of [320, 375, 390, 430]) {
      const frame = guestPanelFrame(
        { top: 80, bottom: 140, left: width - 40, right: width - 8 },
        { width, height: 700 },
      )
      assert.ok(frame.left >= 12, `left ${frame.left} at ${width}`)
      assert.ok(frame.left + frame.width <= width - 12, `right edge at ${width}`)
      assert.ok(frame.top >= 12)
      assert.ok(frame.top + frame.maxHeight <= 700 - 12)
    }
  })

  it('renders stepper controls with accessible names and does not rewrite dates', () => {
    const html = renderToStaticMarkup(
      createElement(BookingCalendar, {
        checkIn: '2026-12-10',
        checkOut: '2026-12-12',
        adults: 2,
        kids: 1,
        onChange: () => undefined,
      }),
    )
    assert.match(html, /2 дорослих/)
    assert.match(html, /1 дитина/)
    assert.match(html, /10 груд/)
    assert.match(html, /12 груд/)
    assert.equal(html.includes('1 дітей'), false)
  })
})

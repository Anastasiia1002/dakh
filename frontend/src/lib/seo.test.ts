import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canonicalUrl, seoForPath } from './seo'
import { stayUrlFromSearch, stayUrlSearch, withStayUrl } from './publicBooking/stayUrl'

describe('seo routes', () => {
  it('indexes public pages and keeps confirmation private', () => {
    assert.equal(seoForPath('/').index, true)
    assert.equal(seoForPath('/rooms').title, 'Кімнати — DAKH Мигове')
    assert.equal(seoForPath('/rooms/').title, 'Кімнати — DAKH Мигове')
    assert.equal(seoForPath('/rooms/dakh-room-14-1').title, 'Кімната — DAKH Мигове')
    assert.equal(seoForPath('/rooms/dakh-room-14-1/').title, 'Кімната — DAKH Мигове')
    assert.equal(seoForPath('/houses/').title, 'Будинки — DAKH Мигове')
    assert.equal(seoForPath('/bronuvannya/pidtverdzhennya/abc').index, false)
    assert.equal(seoForPath('/moie-bronyuvannya').index, false)
  })

  it('builds a canonical URL only with an https origin', () => {
    assert.equal(canonicalUrl('/rooms', '', '/dakh/'), '')
    assert.equal(canonicalUrl('/rooms', 'https://anastasiia1002.github.io', '/dakh/'), 'https://anastasiia1002.github.io/dakh/rooms')
    assert.equal(canonicalUrl('/', 'https://example.com', '/'), 'https://example.com/')
  })
})

describe('stay URL', () => {
  it('round-trips dates and guest counts without default noise', () => {
    const stay = stayUrlFromSearch(new URLSearchParams('from=2026-12-01&to=2026-12-03&adults=3'))
    assert.equal(stay.from, '2026-12-01')
    assert.equal(stay.adults, 3)
    assert.equal(stayUrlSearch({ from: '2026-12-01', to: '2026-12-03', adults: 2, children: 0 }), 'from=2026-12-01&to=2026-12-03')
    assert.equal(withStayUrl('/rooms/dakh-1', stay), '/rooms/dakh-1?from=2026-12-01&to=2026-12-03&adults=3')
  })
})

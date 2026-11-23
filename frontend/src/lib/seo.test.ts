import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_SHARE_IMAGE,
  GITHUB_PAGES_ORIGIN,
  canonicalUrl,
  publicSiteOrigin,
  seoForDetail,
  seoForPath,
  sitemapLocations,
} from './seo'
import { mergeStayIntoSearch, stayUrlFromSearch, stayUrlSearch, withStayUrl } from './publicBooking/stayUrl'

describe('seo routes', () => {
  it('indexes public pages and keeps confirmation private', () => {
    assert.equal(seoForPath('/').index, true)
    assert.equal(seoForPath('/rooms').title, 'Номери — DAKH Мигове')
    assert.equal(seoForPath('/rooms/').title, 'Номери — DAKH Мигове')
    assert.equal(seoForPath('/rooms/dakh-room-14-1').title, 'Номер — DAKH Мигове')
    assert.match(
      seoForDetail('/rooms/dakh-room-14-1', {
        name: '2-кімнатний номер з терасою ( до 4 гостей)',
        maxGuests: 4,
        description: 'Сніданок входить у проживання.\nПри бронюванні від 2-х діб даруємо 2 години чан-зони.',
      }).title,
      /2-кімнатний номер з терасою/,
    )
    assert.equal(seoForPath('/rooms/dakh-room-14-1/').title, 'Номер — DAKH Мигове')
    assert.equal(seoForPath('/houses/').title, 'Будиночки — DAKH Мигове')
    assert.equal(seoForPath('/bronuvannya/pidtverdzhennya/abc').index, false)
    assert.equal(seoForPath('/moie-bronyuvannya').index, false)
    assert.doesNotMatch(seoForPath('/bronuvannya').description, /Оплату на сайті не приймаємо|Дані з сервера/)
  })

  it('builds a canonical URL only with an https origin', () => {
    assert.equal(canonicalUrl('/rooms', '', '/dakh/'), '')
    assert.equal(canonicalUrl('/rooms', 'https://anastasiia1002.github.io', '/dakh/'), 'https://anastasiia1002.github.io/dakh/rooms')
    assert.equal(canonicalUrl('/rooms/', GITHUB_PAGES_ORIGIN, '/dakh/'), 'https://anastasiia1002.github.io/dakh/rooms')
    assert.equal(canonicalUrl('/', 'https://example.com', '/'), 'https://example.com/')
  })

  it('points the published site at GitHub Pages, including room pages and not private routes', () => {
    assert.equal(publicSiteOrigin(''), GITHUB_PAGES_ORIGIN)
    assert.equal(publicSiteOrigin('http://localhost:5174'), GITHUB_PAGES_ORIGIN)
    assert.equal(canonicalUrl('/rooms'), 'https://anastasiia1002.github.io/dakh/rooms')
    assert.equal(canonicalUrl('/'), 'https://anastasiia1002.github.io/dakh/')
    assert.equal(DEFAULT_SHARE_IMAGE, 'https://anastasiia1002.github.io/dakh/images/dakh-facade-night-1280.webp')
    assert.deepEqual(sitemapLocations(['/', '/rooms', '/moie-bronyuvannya', '/rooms/dakh-room-14-1']), [
      'https://anastasiia1002.github.io/dakh/',
      'https://anastasiia1002.github.io/dakh/rooms',
      'https://anastasiia1002.github.io/dakh/rooms/dakh-room-14-1',
    ])
  })
})

describe('stay URL', () => {
  it('round-trips dates and guest counts without default noise', () => {
    const stay = stayUrlFromSearch(new URLSearchParams('from=2026-12-01&to=2026-12-03&adults=3'))
    assert.equal(stay.from, '2026-12-01')
    assert.equal(stay.adults, 3)
    assert.equal(stayUrlSearch({ from: '2026-12-01', to: '2026-12-03', adults: 2, children: 0 }), 'from=2026-12-01&to=2026-12-03')
    assert.equal(withStayUrl('/rooms/dakh-1', stay), '/rooms/dakh-1?from=2026-12-01&to=2026-12-03&adults=3')
    const kept = mergeStayIntoSearch(new URLSearchParams('category=houses&from=2026-11-27&to=2026-11-28'), {
      from: '2026-12-20',
      to: '2026-12-22',
      adults: 2,
      children: 0,
    })
    assert.equal(kept.get('from'), '2026-12-20')
    assert.equal(kept.get('to'), '2026-12-22')
    assert.equal(kept.get('category'), 'houses')
  })
})

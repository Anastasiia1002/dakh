import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { CatalogState } from '../../components/CatalogState'
import { RoomCard } from '../../components/RoomCard'
import { AccommodationCopy } from '../../pages/RoomPage'
import { HotelPage } from '../../pages/HotelPage'
import { PublicApiError } from '../publicBooking/errors'
import type { PublicAccommodation } from '../publicBooking/types'
import { capacityLabel, galleryImages, publicDescription, publicTitle } from './display'
import { accommodationPath, catalogRedirect, isFictionalAccommodationSlug, legacyGotelTarget } from './routes'
import { catalogErrorCopy } from './useAccommodations'

const cover = {
  url: 'https://photos.example/cover.webp',
  alt: 'Обкладинка',
  sortOrder: 0,
}

const cottage: PublicAccommodation = {
  id: 'cottage-10',
  slug: 'sunny-park-10',
  name: 'Будинок №10 до 7 гостей',
  kind: 'COTTAGE',
  description: [
    'Сніданок входить у проживання.',
    'При бронюванні від 2-х діб даруємо 2 години чан-зони.',
    'від 3 днів — знижка (−10%).',
    'для військовослужбовців (−10%).',
    'Комфортні умови для тривалого проживання.',
    'SPA та чан оплачуються додатково.',
  ].join('\n'),
  maxGuests: 8,
  cover,
  images: [
    { url: 'https://photos.example/late.webp', alt: 'Пізніше', sortOrder: 2 },
    cover,
    { url: 'https://photos.example/early.webp', alt: 'Раніше', sortOrder: 1 },
  ],
  hotelSlug: 'sunny-park',
}

const room: PublicAccommodation = {
  ...cottage,
  id: 'room-1',
  slug: 'dakh-room-14-1',
  name: 'Номер 14/1',
  kind: 'ROOM',
  description: 'Сніданок входить у проживання.',
  maxGuests: 4,
  hotelSlug: 'dakh',
}

function markup(node: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(node)
}

describe('catalog routes', () => {
  it('sends /gotel and fictional slugs to the DAKH list', () => {
    assert.equal(legacyGotelTarget(''), '/hotel')
    for (const slug of ['bukovyna', 'goryshche', 'plats', 'Bukovyna']) {
      assert.equal(isFictionalAccommodationSlug(slug), true)
      assert.equal(legacyGotelTarget(slug), '/hotel')
    }
  })

  it('keeps a real DAKH slug on /hotel and builds both property paths', () => {
    assert.equal(legacyGotelTarget('dakh-room-14-1'), '/hotel/dakh-room-14-1')
    assert.equal(accommodationPath('dakh'), '/hotel')
    assert.equal(accommodationPath('dakh', 'dakh-room-14-2'), '/hotel/dakh-room-14-2')
    assert.equal(accommodationPath('sunny-park'), '/sunny-park')
    assert.equal(accommodationPath('sunny-park', 'sunny-park-7'), '/sunny-park/sunny-park-7')
  })

  it('redirects legacy, fictional and old residence URLs', () => {
    assert.equal(catalogRedirect('/gotel'), '/hotel')
    assert.equal(catalogRedirect('/gotel/bukovyna'), '/hotel')
    assert.equal(catalogRedirect('/gotel/goryshche'), '/hotel')
    assert.equal(catalogRedirect('/gotel/plats'), '/hotel')
    assert.equal(catalogRedirect('/hotel/bukovyna'), '/hotel')
    assert.equal(catalogRedirect('/hotel/goryshche'), '/hotel')
    assert.equal(catalogRedirect('/hotel/plats'), '/hotel')
    assert.equal(catalogRedirect('/sunny-park/bukovyna'), '/sunny-park')
    assert.equal(catalogRedirect('/prozhivannya'), '/hotel')
    assert.equal(catalogRedirect('/prozhivannya/bukovyna'), '/hotel')
    assert.equal(catalogRedirect('/gotel/dakh-room-14-1'), '/hotel/dakh-room-14-1')
    assert.equal(catalogRedirect('/hotel/dakh-room-14-1'), null)
    assert.equal(catalogRedirect('/sunny-park/sunny-park-7'), null)
  })
})

describe('catalog display', () => {
  it('drops a title capacity that disagrees with maxGuests and keeps the API name', () => {
    const original = '4- кімнатний будинок до 7 гостей №10'
    assert.equal(publicTitle(original, 8), '4- кімнатний будинок №10')
    assert.equal(original, '4- кімнатний будинок до 7 гостей №10')
    assert.equal(publicTitle('4- кімнатний будинок до 7 гостей №8', 7), '4- кімнатний будинок до 7 гостей №8')
    assert.equal(publicTitle('2- кімнатний номер з терасою ( до 4 гостей) № 14/1', 4), '2- кімнатний номер з терасою ( до 4 гостей) № 14/1')
    assert.equal(capacityLabel(8), 'До 8 гостей')
  })

  it('uses maxGuests and drops unverified promotional lines', () => {
    assert.equal(capacityLabel(8), 'До 8 гостей')
    assert.equal(capacityLabel(1), 'До 1 гостя')
    const text = publicDescription(cottage.description)
    assert.match(text, /Сніданок входить у проживання/)
    assert.match(text, /оплачуються додатково/)
    assert.doesNotMatch(text, /даруємо|знижк|%|тривалого проживання/)
  })

  it('sorts gallery images and skips a repeated cover', () => {
    const images = galleryImages(cottage)
    assert.deepEqual(
      images.map((image) => image.url),
      ['https://photos.example/cover.webp', 'https://photos.example/early.webp', 'https://photos.example/late.webp'],
    )
  })

  it('keeps a network failure distinct from an empty catalog', () => {
    assert.match(catalogErrorCopy(new Error('Failed to fetch')), /прокидається/)
    assert.doesNotMatch(catalogErrorCopy(new Error('Failed to fetch')), /немає опублікованих/)
    assert.match(
      catalogErrorCopy(new PublicApiError({ statusCode: 503, error: 'INTERNAL_ERROR', message: 'down' })),
      /тимчасово недоступний/,
    )
    assert.equal(
      catalogErrorCopy(new PublicApiError({ statusCode: 404, error: 'ROOM_TYPE_NOT_FOUND', message: 'missing' })),
      'Це помешкання не знайдено.',
    )
  })
})

describe('catalog screens', () => {
  it('lists a property without prices or booking actions while loading', () => {
    const html = markup(createElement(MemoryRouter, null, createElement(HotelPage, { hotel: 'dakh' })))
    assert.match(html, /Завантажуємо помешкання/)
    assert.match(html, /Номери/)
    assert.doesNotMatch(html, /Зараз немає опублікованих/)
    assert.doesNotMatch(html, /4800|6200|9200|Забронювати|Буковина|Горище|Пляц|\/gotel/)
  })

  it('shows an error with retry instead of an empty catalog', () => {
    const html = markup(
      createElement(CatalogState, {
        status: 'error',
        error: catalogErrorCopy(new Error('network')),
        onRetry: () => undefined,
        emptyCopy: 'Зараз немає опублікованих номерів.',
      }),
    )
    assert.match(html, /прокидається/)
    assert.match(html, /Спробувати ще раз/)
    assert.doesNotMatch(html, /Зараз немає опублікованих/)
  })

  it('renders a real room and cottage without price or booking text', () => {
    const roomHtml = markup(createElement(MemoryRouter, null, createElement(RoomCard, { accommodation: room })))
    const cottageHtml = markup(
      createElement(
        MemoryRouter,
        null,
        createElement(AccommodationCopy, { room: cottage }),
        createElement(RoomCard, { accommodation: cottage }),
      ),
    )
    assert.match(roomHtml, /href="\/hotel\/dakh-room-14-1"/)
    assert.match(roomHtml, /До 4 гостей/)
    assert.match(cottageHtml, /href="\/sunny-park\/sunny-park-10"/)
    assert.match(cottageHtml, /Будинок №10/)
    assert.match(cottageHtml, /До 8 гостей/)
    assert.doesNotMatch(cottageHtml, /до 7 гостей/)
    assert.match(cottageHtml, /Сніданок входить у проживання/)
    assert.doesNotMatch(`${roomHtml}${cottageHtml}`, /4800|6200|9200|Забронювати|даруємо|−10%|\/gotel|Буковина/)
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { CatalogState } from '../../components/CatalogState'
import { Photo } from '../../components/Photo'
import { RoomCard } from '../../components/RoomCard'
import { Layout } from '../../components/Layout'
import { AccommodationCopy } from '../../pages/RoomPage'
import { HomePage } from '../../pages/HomePage'
import { HotelPage } from '../../pages/HotelPage'
import { BookingPage } from '../../pages/BookingPage'
import { PublicApiError } from '../publicBooking/errors'
import type { PublicAccommodation } from '../publicBooking/types'
import { capacityLabel, galleryImages, publicDescription, publicTitle, stayPolicyLine } from './display'
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
  it('sends /gotel and fictional slugs to the rooms list', () => {
    assert.equal(legacyGotelTarget(''), '/rooms')
    for (const slug of ['bukovyna', 'goryshche', 'plats', 'Bukovyna']) {
      assert.equal(isFictionalAccommodationSlug(slug), true)
      assert.equal(legacyGotelTarget(slug), '/rooms')
    }
  })

  it('builds public category paths and hides the legacy house slug', () => {
    assert.equal(legacyGotelTarget('dakh-room-14-1'), '/rooms/dakh-room-14-1')
    assert.equal(accommodationPath('dakh'), '/rooms')
    assert.equal(accommodationPath('dakh', 'dakh-room-14-2'), '/rooms/dakh-room-14-2')
    assert.equal(accommodationPath('sunny-park'), '/houses')
    assert.equal(accommodationPath('sunny-park', 'sunny-park-7'), '/houses/house-7')
    assert.equal(accommodationPath('sunny-park', 'sunny-park-12'), '/houses/house-12')
    assert.doesNotMatch(accommodationPath('sunny-park', 'sunny-park-10'), /sunny-park/)
  })

  it('redirects legacy, fictional and old residence URLs', () => {
    assert.equal(catalogRedirect('/gotel'), '/rooms')
    assert.equal(catalogRedirect('/gotel/bukovyna'), '/rooms')
    assert.equal(catalogRedirect('/gotel/goryshche'), '/rooms')
    assert.equal(catalogRedirect('/gotel/plats'), '/rooms')
    assert.equal(catalogRedirect('/hotel'), '/rooms')
    assert.equal(catalogRedirect('/hotel/bukovyna'), '/rooms')
    assert.equal(catalogRedirect('/hotel/goryshche'), '/rooms')
    assert.equal(catalogRedirect('/hotel/plats'), '/rooms')
    assert.equal(catalogRedirect('/sunny-park'), '/houses')
    assert.equal(catalogRedirect('/sunny-park/bukovyna'), '/houses')
    assert.equal(catalogRedirect('/prozhivannya'), '/rooms')
    assert.equal(catalogRedirect('/prozhivannya/bukovyna'), '/rooms')
    assert.equal(catalogRedirect('/gotel/dakh-room-14-1'), '/rooms/dakh-room-14-1')
    assert.equal(catalogRedirect('/hotel/dakh-room-14-1'), '/rooms/dakh-room-14-1')
    assert.equal(catalogRedirect('/sunny-park/sunny-park-7'), '/houses/house-7')
    assert.equal(catalogRedirect('/houses/sunny-park-10'), '/houses/house-10')
    assert.equal(catalogRedirect('/rooms/bukovyna'), '/rooms')
    assert.equal(catalogRedirect('/rooms/dakh-room-14-1'), null)
    assert.equal(catalogRedirect('/houses/house-7'), null)
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

  it('hides import notes and repeated paragraphs without turning amenities into facts', () => {
    const imported = [
      'Двокімнатний номер з терасою.',
      'Сніданки входять у вартість.',
      'У номері є: чайник, телевізор, фен.',
      'Джерело BookMeNow id 699ff061a849a82b1b9eac05.',
      'Заїзд з 14:00 до 20:00. Виїзд до 11:00.',
      'Сніданки входять у вартість.',
      'Тварини у формі BookMeNow увімкнені. Надаємо воду та корм для улюбленця.',
      'Тварини у формі BookMeNow вимкнені. Текст форми: не показувати.',
      'Діти у формі BookMeNow вимкнені.',
      'Спальні: Двокімнатний номер з терасою.',
      'Зручності: Wifi; Чайник; Тривале перебування.',
      'Опублікований standardGuestsNumber: 2. Це не максимальна місткість.',
      'minDaysRestriction: 0. cancellationPolicy.enabled: false.',
      'Неперевірена розбіжність BookMeNow: поле guestsMax дорівнює 8.',
    ].join('\n')
    const text = publicDescription(imported)
    assert.match(text, /Двокімнатний номер з терасою/)
    assert.match(text, /У номері є: чайник, телевізор, фен/)
    assert.match(text, /Надаємо воду та корм для улюбленця/)
    assert.equal(text.split('Сніданки входять у вартість').length - 1, 1)
    assert.equal(stayPolicyLine(imported), 'Заїзд з 14:00 до 20:00. Виїзд до 11:00.')
    assert.doesNotMatch(text, /BookMeNow|standardGuestsNumber|minDaysRestriction|Зручності|Спальні|Заїзд|не показувати/)
    assert.equal(stayPolicyLine('Без окремого розкладу.'), null)
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
  it('lists rooms without prices, booking actions or the legacy property name', () => {
    const html = markup(createElement(MemoryRouter, null, createElement(HotelPage, { category: 'rooms' })))
    const houses = markup(createElement(MemoryRouter, null, createElement(HotelPage, { category: 'houses' })))
    const home = markup(createElement(MemoryRouter, null, createElement(HomePage)))
    const layout = markup(createElement(MemoryRouter, null, createElement(Layout)))
    assert.match(html, /Завантажуємо помешкання/)
    assert.match(html, /animate-pulse/)
    assert.match(html, /Кімнати/)
    assert.match(houses, /Будинки/)
    assert.match(home, /Кімнати/)
    assert.match(home, /Будинки/)
    assert.match(home, /loading="eager"/)
    assert.match(layout, /href="\/rooms"/)
    assert.match(layout, /href="\/houses"/)
    const visible = `${html}${houses}${home}${layout}`
    assert.doesNotMatch(visible, /Sunny Park|sunny-park|Номери|Зараз немає опублікованих/)
    assert.doesNotMatch(visible, /4800|6200|9200|Забронювати|Горище|Пляц|\/gotel|\/availability|\/quotes|booking-intents/)
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
    assert.match(roomHtml, /href="\/rooms\/dakh-room-14-1"/)
    assert.match(roomHtml, /loading="lazy"/)
    assert.match(roomHtml, /До 4 гостей/)
    assert.match(cottageHtml, /href="\/houses\/house-10"/)
    assert.doesNotMatch(cottageHtml, /sunny-park|Sunny Park/)
    assert.match(cottageHtml, /Будинок №10/)
    assert.match(cottageHtml, /До 8 гостей/)
    assert.doesNotMatch(cottageHtml, /до 7 гостей/)
    assert.match(cottageHtml, /Сніданок входить у проживання/)
    assert.doesNotMatch(`${roomHtml}${cottageHtml}`, /4800|6200|9200|Забронювати|даруємо|−10%|\/gotel|Буковина/)
  })

  it('lazy-loads offscreen photos and keeps a fallback when the file fails to render', () => {
    const lazy = markup(createElement(Photo, { src: 'https://photos.example/late.webp', alt: 'Пізніше' }))
    const hero = markup(createElement(Photo, { src: 'https://photos.example/cover.webp', alt: 'Обкладинка', priority: true }))
    assert.match(lazy, /loading="lazy"/)
    assert.match(hero, /loading="eager"/)
    assert.match(hero, /fetchPriority="high"/)
  })

  it('keeps booking closed and makes no booking request from the public page', () => {
    const html = markup(createElement(MemoryRouter, null, createElement(BookingPage)))
    assert.match(html, /Онлайн-бронювання зараз вимкнене/)
    assert.match(html, /href="\/rooms"/)
    assert.doesNotMatch(html, /Забронювати|тестова ціна|\/quotes|booking-intents|\/availability/)
  })
})

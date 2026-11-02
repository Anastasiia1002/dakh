import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { site } from '../../data/catalog'

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const approvedLatitude = 48.1369194
const approvedLongitude = 25.36198
const previousLatitude = '48.1509479'
const previousLongitude = '25.379971'
const placeUrl = 'https://maps.app.goo.gl/AWwFzLHT6x8xuu8P8'
const directionsUrl =
  'https://www.google.com/maps/dir/?api=1&destination=48.1369194%2C25.36198'

function source(path: string) {
  return readFileSync(join(frontendRoot, path), 'utf8')
}

function mapAnchors(path: string) {
  return [
    ...source(path).matchAll(
      /<a\b(?:[^>]|\n)*?href=\{site\.map\.(?:place|directions)\}(?:[^>]|\n)*?>/g,
    ),
  ].map((match) => match[0])
}

describe('approved DAKH map location', () => {
  it('stores the approved coordinates and keeps the display address', () => {
    assert.equal(site.map.lat, approvedLatitude)
    assert.equal(site.map.lng, approvedLongitude)
    assert.equal(site.address, 'вул. Солонецька, 2-И, с. Мигове')
    assert.equal(site.map.place, placeUrl)
  })

  it('builds a Google directions URL to the approved pin', () => {
    const destination = new URL(site.map.directions).searchParams.get('destination')
    assert.equal(site.map.directions, directionsUrl)
    assert.equal(destination, `${approvedLatitude},${approvedLongitude}`)
    assert.equal(site.map.directions.includes(previousLatitude), false)
    assert.equal(site.map.directions.includes(previousLongitude), false)
  })

  it('centers the OpenStreetMap embed and marker on the approved pin', () => {
    const embed = new URL(site.map.embed)
    const [west, south, east, north] = embed.searchParams.get('bbox')!.split(',').map(Number)
    const [markerLat, markerLng] = embed.searchParams.get('marker')!.split(',').map(Number)
    assert.equal(embed.origin + embed.pathname, 'https://www.openstreetmap.org/export/embed.html')
    assert.equal(embed.searchParams.get('layer'), 'mapnik')
    assert.equal(markerLat, approvedLatitude)
    assert.equal(markerLng, approvedLongitude)
    assert.ok(Math.abs((south + north) / 2 - approvedLatitude) < 1e-9)
    assert.ok(Math.abs((west + east) / 2 - approvedLongitude) < 1e-9)
    assert.equal(site.map.embed.includes(previousLatitude), false)
    assert.equal(site.map.embed.includes(previousLongitude), false)
  })

  it('keeps the previous coordinates out of the active location configuration', () => {
    const active = [
      'src/data/catalog.ts',
      'src/pages/ContactPage.tsx',
      'src/components/Layout.tsx',
      'src/pages/HomePage.tsx',
    ]
      .map(source)
      .join('\n')
    assert.equal(active.includes(previousLatitude), false)
    assert.equal(active.includes(previousLongitude), false)
    assert.equal(JSON.stringify(site.map).includes(previousLatitude), false)
  })

  it('sends the contact address and footer to the same approved listing', () => {
    const contact = source('src/pages/ContactPage.tsx')
    const footer = source('src/components/Layout.tsx')
    assert.equal(contact.includes('href={site.map.place}'), true)
    assert.equal(footer.includes('href={site.map.place}'), true)
    assert.equal(contact.includes('href={site.map.directions}'), true)
    assert.equal(footer.includes('href={site.map.directions}'), false)
    assert.equal(site.map.place, placeUrl)
  })

  it('keeps map links external and noreferrer', () => {
    const anchors = [...mapAnchors('src/pages/ContactPage.tsx'), ...mapAnchors('src/components/Layout.tsx')]
    assert.equal(anchors.length, 4)
    for (const anchor of anchors) {
      assert.match(anchor, /target="_blank"/)
      assert.match(anchor, /rel="noreferrer"/)
    }
  })
})

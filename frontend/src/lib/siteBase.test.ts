import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { resolveSiteBase } from './siteBase'

describe('site base', () => {
  it('uses / on Vercel and /dakh/ for GitHub Pages', () => {
    assert.equal(resolveSiteBase({ VERCEL: '1' }), '/')
    assert.equal(resolveSiteBase({}), '/dakh/')
    assert.equal(resolveSiteBase({ VERCEL: '0' }), '/dakh/')
  })

  it('lets an explicit base win over the Vercel signal', () => {
    assert.equal(resolveSiteBase({ DAKH_SITE_BASE: '/dakh/', VERCEL: '1' }), '/dakh/')
    assert.equal(resolveSiteBase({ DAKH_SITE_BASE: '/', VERCEL: '1' }), '/')
    assert.equal(resolveSiteBase({ DAKH_SITE_BASE: 'dakh' }), '/dakh/')
  })

  it('rejects a host, a nested path, and an empty segment', () => {
    assert.throws(() => resolveSiteBase({ DAKH_SITE_BASE: 'https://dakh-olive.vercel.app/' }), /DAKH_SITE_BASE/)
    assert.throws(() => resolveSiteBase({ DAKH_SITE_BASE: '/dakh/rooms' }), /DAKH_SITE_BASE/)
    assert.equal(resolveSiteBase({ DAKH_SITE_BASE: '' }), '/dakh/')
  })
})

describe('Vercel SPA rewrite', () => {
  const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
    rewrites: { source: string; destination: string }[]
  }
  const rewrite = config.rewrites[0]
  const pattern = new RegExp(`^${rewrite.source}$`)

  it('sends application routes to index.html and leaves asset paths alone', () => {
    assert.equal(rewrite.destination, '/index.html')
    assert.match('/rooms/dakh-room-14-1', pattern)
    assert.match('/bronuvannya', pattern)
    assert.match('/', pattern)
    assert.doesNotMatch('/assets/index-abc.js', pattern)
    assert.doesNotMatch('/assets/index-abc.css', pattern)
  })
})

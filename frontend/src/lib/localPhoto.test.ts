import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { heroPreload, localWebpSrcSet } from './localPhoto'

describe('local photo variants', () => {
  it('builds webp srcset for DAKH JPEGs and leaves remote photos alone', () => {
    assert.match(localWebpSrcSet('/dakh/images/dakh-facade-night.jpg') ?? '', /dakh-facade-night-800\.webp 800w/)
    assert.equal(localWebpSrcSet('https://images.unsplash.com/photo.jpg'), undefined)
  })

  it('preloads the mobile hero from the site base', () => {
    const preload = heroPreload('/dakh/')
    assert.equal(preload.href, '/dakh/images/dakh-facade-night-800.webp')
    assert.match(preload.imagesrcset, /1920w/)
  })
})

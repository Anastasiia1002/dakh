import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { officialSocials } from './siteSocials'
import { site } from '../data/catalog'

describe('official social links', () => {
  it('omits the placeholder Instagram URL from the public site', () => {
    assert.equal(site.instagram, 'https://instagram.com/')
    assert.deepEqual(officialSocials(site), [])
    assert.deepEqual(officialSocials({ instagram: 'https://instagram.com/dakh.myhovo' }), [
      { label: 'Instagram', href: 'https://instagram.com/dakh.myhovo' },
    ])
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { officialSocials } from './siteSocials'
import { site } from '../data/catalog'

describe('official social links', () => {
  it('publishes the DAKH Instagram profile and omits a bare instagram.com host', () => {
    assert.equal(site.instagram, 'https://www.instagram.com/dakh.myhovo/')
    assert.deepEqual(officialSocials(site), [{ label: 'Instagram', href: 'https://www.instagram.com/dakh.myhovo/' }])
    assert.deepEqual(officialSocials({ instagram: 'https://instagram.com/' }), [])
  })
})

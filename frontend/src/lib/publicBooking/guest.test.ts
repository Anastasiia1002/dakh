import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { guestFieldErrors, guestFormIsValid, personNameError, toGuestContact } from './guest'

describe('guest contact', () => {
  it('requires separate first and last names within 1–100 characters', () => {
    assert.match(personNameError('', 'ім’я') ?? '', /ім/)
    assert.match(personNameError('A'.repeat(101), 'прізвище') ?? '', /100/)
    assert.match(personNameError('123', 'ім’я') ?? '', /літер/)
    assert.equal(personNameError('Іван', 'ім’я'), undefined)
  })

  it('does not invent a last name from a single field', () => {
    const errors = guestFieldErrors({
      firstName: 'Іван Коваленко',
      lastName: '',
      phone: '',
      email: 'ivan@example.com',
    })
    assert.ok(errors.lastName)
    assert.equal(
      guestFormIsValid({
        firstName: 'Іван',
        lastName: 'Коваленко',
        phone: '',
        email: 'ivan@example.com',
      }),
      true,
    )
  })

  it('omits empty phone and keeps a provided number', () => {
    assert.equal(
      toGuestContact({
        firstName: 'Іван',
        lastName: 'Коваленко',
        phone: '',
        email: 'ivan@example.com',
      }).phone,
      undefined,
    )
    const withPhone = toGuestContact({
      firstName: 'Іван',
      lastName: 'Коваленко',
      phone: '0958180001',
      email: 'ivan@example.com',
    })
    assert.equal(withPhone.phone, '+38 (095) 818-00-01')
  })
})

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
      false,
    )
  })

  it('requires a valid phone and normalizes Ukrainian and international numbers', () => {
    assert.match(guestFieldErrors({
      firstName: 'Іван',
      lastName: 'Коваленко',
      phone: '',
      email: 'ivan@example.com',
    }).phone ?? '', /телефон/)
    assert.ok(guestFieldErrors({
      firstName: 'Іван',
      lastName: 'Коваленко',
      phone: '123',
      email: 'ivan@example.com',
    }).phone)
    assert.equal(
      toGuestContact({
        firstName: 'Іван',
        lastName: 'Коваленко',
        phone: '0958180001',
        email: 'ivan@example.com',
      }).phone,
      '+380958180001',
    )
    assert.equal(
      toGuestContact({
        firstName: 'Іван',
        lastName: 'Коваленко',
        phone: '+1 415 555 2671',
        email: 'ivan@example.com',
      }).phone,
      '+14155552671',
    )
    assert.match(guestFieldErrors({
      firstName: 'Іван',
      lastName: 'Коваленко',
      phone: '+380501112233',
      email: 'ivan@example.com',
      comment: 'x'.repeat(1001),
    }).comment ?? '', /1000/)
  })
})

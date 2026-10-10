import { emailError } from '../email'
import { formatUaMobile, uaMobileError } from '../phone'
import type { PublicGuestContact } from './types'
import { MAX_GUEST_EMAIL, MAX_GUEST_PHONE, MAX_PERSON_NAME, MAX_RECOVER_EMAIL, MIN_PERSON_NAME } from './types'

export type GuestFieldErrors = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

export function personNameError(value: string, label: string) {
  const name = value.trim()
  if (!name) return `Вкажіть ${label}.`
  if (name.length < MIN_PERSON_NAME) return `${label} не може бути порожнім.`
  if (name.length > MAX_PERSON_NAME) return `${label} не може бути довше ${MAX_PERSON_NAME} символів.`
  if (!/\p{L}/u.test(name)) return `${label} має містити літери.`
  return undefined
}

export function guestEmailError(value: string) {
  const mail = emailError(value)
  if (mail) return mail
  if (value.trim().length > MAX_GUEST_EMAIL) return `Пошта не може бути довша за ${MAX_GUEST_EMAIL} символів.`
  return undefined
}

export function guestPhoneError(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.length > MAX_GUEST_PHONE) return `Телефон не може бути довший за ${MAX_GUEST_PHONE} символів.`
  return uaMobileError(trimmed)
}

export function guestFieldErrors(guest: {
  firstName: string
  lastName: string
  phone: string
  email: string
}): GuestFieldErrors {
  const errors: GuestFieldErrors = {}
  const firstName = personNameError(guest.firstName, 'ім’я')
  if (firstName) errors.firstName = firstName
  const lastName = personNameError(guest.lastName, 'прізвище')
  if (lastName) errors.lastName = lastName
  const phone = guestPhoneError(guest.phone)
  if (phone) errors.phone = phone
  const email = guestEmailError(guest.email)
  if (email) errors.email = email
  return errors
}

export function recoverEmailError(value: string) {
  const mail = emailError(value)
  if (mail) return mail
  if (value.trim().length > MAX_RECOVER_EMAIL) return `Пошта не може бути довша за ${MAX_RECOVER_EMAIL} символів.`
  return undefined
}

export function guestFormIsValid(guest: {
  firstName: string
  lastName: string
  phone: string
  email: string
}) {
  return Object.keys(guestFieldErrors(guest)).length === 0
}

export function toGuestContact(guest: {
  firstName: string
  lastName: string
  phone: string
  email: string
}): PublicGuestContact {
  const phone = guest.phone.trim()
  const formatted = phone ? formatUaMobile(phone) : null
  const contact: PublicGuestContact = {
    firstName: guest.firstName.trim(),
    lastName: guest.lastName.trim(),
    email: guest.email.trim(),
  }
  if (formatted || phone) contact.phone = formatted || phone
  return contact
}

import { emailError } from '../email'
import { bookingPhoneE164, bookingPhoneError } from '../phone'
import type { PublicGuestContact } from './types'
import { MAX_GUEST_EMAIL, MAX_PERSON_NAME, MAX_RECOVER_EMAIL, MIN_PERSON_NAME } from './types'

export const MAX_GUEST_COMMENT = 1000

export type GuestFieldErrors = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  comment?: string
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
  return bookingPhoneError(value)
}

export function guestCommentError(value: string) {
  const text = value.trim()
  if (text.length > MAX_GUEST_COMMENT) return `Коментар не може бути довший за ${MAX_GUEST_COMMENT} символів.`
  return undefined
}

export function guestFieldErrors(guest: {
  firstName: string
  lastName: string
  phone: string
  email: string
  comment?: string
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
  const comment = guestCommentError(guest.comment ?? '')
  if (comment) errors.comment = comment
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
  comment?: string
}) {
  return Object.keys(guestFieldErrors(guest)).length === 0
}

export function toGuestContact(guest: {
  firstName: string
  lastName: string
  phone: string
  email: string
}): PublicGuestContact {
  const phone = bookingPhoneE164(guest.phone)
  return {
    firstName: guest.firstName.trim(),
    lastName: guest.lastName.trim(),
    email: guest.email.trim(),
    phone: phone ?? guest.phone.trim(),
  }
}

export function guestCommentForIntent(comment: string) {
  const text = comment.trim()
  return text ? text : undefined
}

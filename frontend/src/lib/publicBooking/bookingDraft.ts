import type { BookingDraft } from '../booking'
import { emptyDraft } from '../booking'
import { partySummary } from '../ukrainian'
import { clearStoredIntent } from './checkout'
import { clearBookingHandoff, handoffToSearch, loadBookingHandoff, saveBookingHandoff, type BookingHandoff } from './handoff'
import {
  migrateServicesByUnit,
  persistServicesByUnit,
  servicesForUnit,
  setServicesForUnit,
  type ServiceQuantities,
  type ServicesByUnit,
} from './publicServices'

export const BOOKING_DRAFT_VERSION = 3
export const BOOKING_DRAFT_KEY = 'dakh-booking-draft'
export const BOOKING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000

export const WIZARD_STEPS = [
  { id: 'dates', label: 'Дати й гості' },
  { id: 'stay', label: 'Розміщення' },
  { id: 'extras', label: 'Послуги' },
  { id: 'contacts', label: 'Контакти' },
  { id: 'confirm', label: 'Підтвердження' },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

export type PendingVerificationDraft = {
  intentId: string
  emailMasked: string
  expiresAt: string
  cooldownUntil: number
  otpExpiresAt: string
}

const ATTEMPT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function newBookingAttemptId() {
  return crypto.randomUUID()
}

function parseAttemptId(value: unknown) {
  return typeof value === 'string' && ATTEMPT_ID_PATTERN.test(value) ? value : ''
}

export type VersionedBookingDraft = {
  v: typeof BOOKING_DRAFT_VERSION
  attemptId: string
  savedAt: number
  expiresAt: number
  step: WizardStepId
  extrasSkipped: boolean
  checkIn: string
  checkOut: string
  adults: number
  children: number
  hotelSlug: string
  catalogSlug: string
  roomTypeId: string
  roomTypeSlug: string
  ratePlanId: string
  services: ServiceQuantities
  servicesByUnit: ServicesByUnit
  firstName: string
  lastName: string
  phone: string
  email: string
  comment: string
  pending: PendingVerificationDraft | null
}

function sessionStore() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function isCount(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function parsePending(value: unknown): PendingVerificationDraft | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.intentId !== 'string' || raw.intentId.length < 8) return null
  if (typeof raw.emailMasked !== 'string' || !raw.emailMasked.includes('*')) return null
  if (typeof raw.expiresAt !== 'string') return null
  const cooldownUntil = typeof raw.cooldownUntil === 'number' && Number.isFinite(raw.cooldownUntil) ? raw.cooldownUntil : 0
  const otpExpiresAt = typeof raw.otpExpiresAt === 'string' ? raw.otpExpiresAt : ''
  if ('otp' in raw || 'code' in raw) return { intentId: raw.intentId, emailMasked: raw.emailMasked, expiresAt: raw.expiresAt, cooldownUntil, otpExpiresAt }
  return { intentId: raw.intentId, emailMasked: raw.emailMasked, expiresAt: raw.expiresAt, cooldownUntil, otpExpiresAt }
}

const STEPS = new Set<WizardStepId>(WIZARD_STEPS.map((step) => step.id))

export function parseVersionedDraft(value: unknown, now = Date.now()): VersionedBookingDraft | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.v !== 1 && raw.v !== 2 && raw.v !== 3) return null
  if (typeof raw.expiresAt !== 'number' || raw.expiresAt <= now) return null
  if (typeof raw.otp === 'string' || typeof raw.code === 'string') return null
  const step = STEPS.has(raw.step as WizardStepId) ? (raw.step as WizardStepId) : 'dates'
  const adults = isCount(raw.adults, 1, 20) ? raw.adults : 2
  const children = isCount(raw.children, 0, 20) ? raw.children : 0
  const roomTypeId = typeof raw.roomTypeId === 'string' ? raw.roomTypeId : ''
  const servicesByUnit = migrateServicesByUnit({
    roomTypeId,
    services: raw.services,
    servicesByUnit: raw.servicesByUnit,
  })
  return {
    v: BOOKING_DRAFT_VERSION,
    attemptId: parseAttemptId(raw.attemptId),
    savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : now,
    expiresAt: raw.expiresAt,
    step,
    extrasSkipped: raw.extrasSkipped === true,
    checkIn: typeof raw.checkIn === 'string' ? raw.checkIn : '',
    checkOut: typeof raw.checkOut === 'string' ? raw.checkOut : '',
    adults,
    children,
    hotelSlug: typeof raw.hotelSlug === 'string' ? raw.hotelSlug : '',
    catalogSlug: typeof raw.catalogSlug === 'string' ? raw.catalogSlug : '',
    roomTypeId,
    roomTypeSlug: typeof raw.roomTypeSlug === 'string' ? raw.roomTypeSlug : '',
    ratePlanId: typeof raw.ratePlanId === 'string' ? raw.ratePlanId : '',
    services: servicesForUnit(servicesByUnit, roomTypeId),
    servicesByUnit,
    firstName: typeof raw.firstName === 'string' ? raw.firstName : '',
    lastName: typeof raw.lastName === 'string' ? raw.lastName : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    comment: typeof raw.comment === 'string' ? raw.comment : '',
    pending: parsePending(raw.pending),
  }
}

export function readBookingDraft(now = Date.now()): VersionedBookingDraft | null {
  const raw = sessionStore()?.getItem(BOOKING_DRAFT_KEY)
  if (!raw) return null
  try {
    return parseVersionedDraft(JSON.parse(raw), now)
  } catch {
    return null
  }
}

export function writeBookingDraft(patch: Partial<VersionedBookingDraft>, now = Date.now()) {
  const current = readBookingDraft(now) ?? blankDraft(now)
  const roomTypeId = patch.roomTypeId ?? current.roomTypeId
  let servicesByUnit = patch.servicesByUnit ?? current.servicesByUnit
  if (patch.services && !patch.servicesByUnit) {
    servicesByUnit = setServicesForUnit(servicesByUnit, roomTypeId, patch.services)
  }
  const next: VersionedBookingDraft = {
    ...current,
    ...patch,
    v: BOOKING_DRAFT_VERSION,
    attemptId: parseAttemptId(patch.attemptId) || current.attemptId || newBookingAttemptId(),
    savedAt: now,
    expiresAt: now + BOOKING_DRAFT_TTL_MS,
    roomTypeId,
    servicesByUnit,
    pending: patch.pending === undefined ? current.pending : patch.pending,
  }
  next.services = servicesForUnit(next.servicesByUnit, next.roomTypeId)
  const { otp: _otp, code: _code, ...safe } = next as VersionedBookingDraft & { otp?: unknown; code?: unknown }
  sessionStore()?.setItem(BOOKING_DRAFT_KEY, JSON.stringify(safe))
  persistServicesByUnit(next.servicesByUnit)
  return next
}

export function clearBookingDraft() {
  sessionStore()?.removeItem(BOOKING_DRAFT_KEY)
  persistServicesByUnit({})
  clearBookingHandoff()
}

function blankDraft(now: number): VersionedBookingDraft {
  return {
    v: BOOKING_DRAFT_VERSION,
    attemptId: '',
    savedAt: now,
    expiresAt: now + BOOKING_DRAFT_TTL_MS,
    step: 'dates',
    extrasSkipped: false,
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    hotelSlug: '',
    catalogSlug: '',
    roomTypeId: '',
    roomTypeSlug: '',
    ratePlanId: '',
    services: {},
    servicesByUnit: {},
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    comment: '',
    pending: null,
  }
}

export function formDraftFromStored(
  stored: VersionedBookingDraft | null,
  fallback: BookingDraft = emptyDraft,
  attemptId?: string,
): BookingDraft {
  if (!stored) return fallback
  if (attemptId && stored.attemptId && stored.attemptId !== attemptId) return fallback
  return {
    ...fallback,
    checkIn: stored.checkIn || fallback.checkIn,
    checkOut: stored.checkOut || fallback.checkOut,
    adults: stored.adults || fallback.adults,
    children: stored.children,
    firstName: stored.firstName,
    lastName: stored.lastName,
    phone: stored.phone,
    email: stored.email,
    comment: stored.comment,
    roomTypeId: stored.roomTypeId || fallback.roomTypeId,
    ratePlanId: stored.ratePlanId || fallback.ratePlanId,
  }
}

export function replaceBookingDraft(patch: Partial<VersionedBookingDraft>, now = Date.now()) {
  sessionStore()?.removeItem(BOOKING_DRAFT_KEY)
  persistServicesByUnit({})
  return writeBookingDraft(patch, now)
}

export function draftIsResumable(draft: VersionedBookingDraft | null, now = Date.now()) {
  if (!draft?.attemptId || draft.expiresAt <= now) return false
  return Boolean(draft.roomTypeId || draft.checkIn || draft.pending || draft.email || draft.firstName)
}

export function resumeBookingHref(draft: VersionedBookingDraft) {
  const stored = loadBookingHandoff()
  const params =
    stored && stored.roomTypeId === draft.roomTypeId
      ? handoffToSearch({ ...stored, attemptId: draft.attemptId })
      : new URLSearchParams()
  if (draft.attemptId) params.set('attempt', draft.attemptId)
  const query = params.toString()
  return query ? `/bronuvannya?${query}` : '/bronuvannya'
}

export function startNewAttemptFromHandoff(handoff: BookingHandoff, services: ServiceQuantities = {}) {
  const attemptId = newBookingAttemptId()
  const forUnit = Object.keys(services).length > 0 ? services : handoff.services ?? {}
  const nextHandoff: BookingHandoff = { ...handoff, attemptId, services: forUnit }
  clearStoredIntent()
  replaceBookingDraft({
    attemptId,
    checkIn: handoff.checkIn,
    checkOut: handoff.checkOut,
    adults: handoff.adults,
    children: handoff.children,
    hotelSlug: handoff.hotelSlug,
    catalogSlug: handoff.catalogSlug,
    roomTypeId: handoff.roomTypeId,
    roomTypeSlug: handoff.roomTypeSlug,
    ratePlanId: handoff.ratePlanId,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    comment: '',
    extrasSkipped: false,
    pending: null,
    servicesByUnit: Object.keys(forUnit).length > 0 ? { [handoff.roomTypeId]: forUnit } : {},
    step: 'extras',
  })
  saveBookingHandoff(nextHandoff)
  return nextHandoff
}

export function seedDraftFromHandoff(handoff: BookingHandoff, services: ServiceQuantities = {}) {
  return startNewAttemptFromHandoff(handoff, services)
}

export function visibleWizardSteps(_locked = false) {
  return [...WIZARD_STEPS]
}

export function wizardIndex(step: WizardStepId, locked: boolean) {
  return visibleWizardSteps(locked).findIndex((item) => item.id === step)
}

export function occupancySummary(adults: number, children: number) {
  return partySummary(adults, children)
}

export { loadBookingHandoff }

import type { BookingDraft } from '../booking'
import { emptyDraft } from '../booking'
import { partySummary } from '../ukrainian'
import { clearBookingHandoff, loadBookingHandoff, saveBookingHandoff, type BookingHandoff } from './handoff'
import { persistServiceQuantities } from './publicServices'

export const BOOKING_DRAFT_VERSION = 1
export const BOOKING_DRAFT_KEY = 'dakh-booking-draft'
export const BOOKING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000

export const WIZARD_STEPS = [
  { id: 'dates', label: 'Дати й гості' },
  { id: 'stay', label: 'Розміщення' },
  { id: 'extras', label: 'Додаткові послуги' },
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

export type VersionedBookingDraft = {
  v: typeof BOOKING_DRAFT_VERSION
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
  services: Record<string, number>
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

function parseServices(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const next: Record<string, number> = {}
  for (const [id, quantity] of Object.entries(value as Record<string, unknown>)) {
    if (typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
      next[id] = quantity
    }
  }
  return next
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
  if (raw.v !== BOOKING_DRAFT_VERSION) return null
  if (typeof raw.expiresAt !== 'number' || raw.expiresAt <= now) return null
  if (typeof raw.otp === 'string' || typeof raw.code === 'string') return null
  const step = STEPS.has(raw.step as WizardStepId) ? (raw.step as WizardStepId) : 'dates'
  const adults = isCount(raw.adults, 1, 20) ? raw.adults : 2
  const children = isCount(raw.children, 0, 20) ? raw.children : 0
  return {
    v: BOOKING_DRAFT_VERSION,
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
    roomTypeId: typeof raw.roomTypeId === 'string' ? raw.roomTypeId : '',
    roomTypeSlug: typeof raw.roomTypeSlug === 'string' ? raw.roomTypeSlug : '',
    ratePlanId: typeof raw.ratePlanId === 'string' ? raw.ratePlanId : '',
    services: parseServices(raw.services),
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
  const next: VersionedBookingDraft = {
    ...current,
    ...patch,
    v: BOOKING_DRAFT_VERSION,
    savedAt: now,
    expiresAt: now + BOOKING_DRAFT_TTL_MS,
    services: patch.services ?? current.services,
    pending: patch.pending === undefined ? current.pending : patch.pending,
  }
  const { otp: _otp, code: _code, ...safe } = next as VersionedBookingDraft & { otp?: unknown; code?: unknown }
  sessionStore()?.setItem(BOOKING_DRAFT_KEY, JSON.stringify(safe))
  persistServiceQuantities(next.services)
  return next
}

export function clearBookingDraft() {
  sessionStore()?.removeItem(BOOKING_DRAFT_KEY)
  persistServiceQuantities({})
  clearBookingHandoff()
}

function blankDraft(now: number): VersionedBookingDraft {
  return {
    v: BOOKING_DRAFT_VERSION,
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
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    comment: '',
    pending: null,
  }
}

export function formDraftFromStored(stored: VersionedBookingDraft | null, fallback: BookingDraft = emptyDraft): BookingDraft {
  if (!stored) return fallback
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

export function seedDraftFromHandoff(handoff: BookingHandoff, services: Record<string, number> = {}) {
  writeBookingDraft({
    checkIn: handoff.checkIn,
    checkOut: handoff.checkOut,
    adults: handoff.adults,
    children: handoff.children,
    hotelSlug: handoff.hotelSlug,
    catalogSlug: handoff.catalogSlug,
    roomTypeId: handoff.roomTypeId,
    roomTypeSlug: handoff.roomTypeSlug,
    ratePlanId: handoff.ratePlanId,
    services: Object.keys(services).length > 0 ? services : handoff.services ?? {},
    step: 'extras',
  })
  saveBookingHandoff(handoff)
}

export function visibleWizardSteps(locked: boolean) {
  return locked ? WIZARD_STEPS.filter((step) => step.id !== 'stay') : [...WIZARD_STEPS]
}

export function wizardIndex(step: WizardStepId, locked: boolean) {
  return visibleWizardSteps(locked).findIndex((item) => item.id === step)
}

export function occupancySummary(adults: number, children: number) {
  return partySummary(adults, children)
}

export { loadBookingHandoff }

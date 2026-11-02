import { emailError } from './email'
import { uaMobileError } from './phone'

export type ContactFields = {
  name: string
  phone: string
  email: string
  message: string
}

export type ContactErrors = Partial<Record<keyof ContactFields, string>>

export const emptyContactFields: ContactFields = { name: '', phone: '', email: '', message: '' }

/** Server accepted the message for processing. This is not a delivery receipt. */
export const CONTACT_ACCEPTED_COPY =
  'Дякуємо. Ми прийняли повідомлення і передали його на обробку адміністрації DAKH. Це ще не означає, що лист уже прочитано. Якщо відповіді не буде, зателефонуйте.'

export type ContactFailureKind = 'unconfigured' | 'network' | 'rate_limited' | 'unavailable' | 'rejected'

export function contactFailureCopy(kind: ContactFailureKind): string {
  switch (kind) {
    case 'unconfigured':
      return 'Форма зараз не підключена до сервера. Зателефонуйте або напишіть на пошту, вказану на цій сторінці.'
    case 'network':
      return 'Не вдалося надіслати повідомлення. Перевірте з’єднання і спробуйте ще раз.'
    case 'rate_limited':
      return 'Забагато спроб. Зачекайте кілька хвилин і спробуйте ще раз.'
    case 'unavailable':
      return 'Зараз не можемо прийняти повідомлення. Зателефонуйте нам.'
    case 'rejected':
      return 'Не вдалося прийняти повідомлення. Перевірте поля або зателефонуйте нам.'
  }
}

export function validateContact(values: ContactFields): ContactErrors {
  const errors: ContactErrors = {}
  const name = values.name.trim()
  const message = values.message.trim()

  if (!name) errors.name = 'Вкажіть ім’я.'
  else if (name.length < 2) errors.name = 'Ім’я має мати щонайменше дві літери.'
  else if (!/\p{L}/u.test(name)) errors.name = 'Ім’я має містити літери.'

  const phoneError = uaMobileError(values.phone)
  if (phoneError) errors.phone = phoneError

  const mailError = emailError(values.email)
  if (mailError) errors.email = mailError

  if (!message) errors.message = 'Напишіть, про що йдеться.'
  else if (message.length < 8) errors.message = 'Трохи більше деталей — хоча б кілька слів.'

  return errors
}

export function canSubmitContact(sending: boolean): boolean {
  return !sending
}

export function fieldsAfterContactResult(values: ContactFields, accepted: boolean): ContactFields {
  return accepted ? emptyContactFields : values
}

export type ContactSubmission = ContactFields & { company: string }

export async function postContactMessage(
  input: ContactSubmission,
  options: {
    baseUrl: string | null
    idempotencyKey: string
    fetchImpl?: typeof fetch
  },
): Promise<{ ok: true } | { ok: false; kind: ContactFailureKind }> {
  if (!options.baseUrl) return { ok: false, kind: 'unconfigured' }
  const fetchImpl = options.fetchImpl ?? fetch
  try {
    const response = await fetchImpl(`${options.baseUrl.replace(/\/$/, '')}/contact-messages`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'idempotency-key': options.idempotencyKey,
      },
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        email: input.email,
        message: input.message,
        company: input.company,
      }),
    })
    if (response.status === 200) {
      const body = (await response.json().catch(() => null)) as { status?: unknown } | null
      if (body?.status === 'accepted') return { ok: true }
      return { ok: false, kind: 'rejected' }
    }
    if (response.status === 429) return { ok: false, kind: 'rate_limited' }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return { ok: false, kind: 'unavailable' }
    }
    return { ok: false, kind: 'rejected' }
  } catch {
    return { ok: false, kind: 'network' }
  }
}

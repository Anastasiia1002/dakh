import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  CONTACT_ACCEPTED_COPY,
  canSubmitContact,
  contactFailureCopy,
  fieldsAfterContactResult,
  postContactMessage,
  validateContact,
  type ContactFields,
} from './contactForm.ts'

const filled: ContactFields = {
  name: 'Олена',
  phone: '0958180001',
  email: 'guest@example.com',
  message: 'Потрібен стіл на суботу.',
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('contact form', () => {
  it('requires a name, a Ukrainian mobile number, an email, and a short message', () => {
    const errors = validateContact({ name: '1', phone: '123', email: 'not-mail', message: 'коротко' })
    assert.ok(errors.name)
    assert.ok(errors.phone)
    assert.ok(errors.email)
    assert.ok(errors.message)
    assert.deepEqual(validateContact(filled), {})
  })

  it('treats only an accepted response as success and does not claim delivery', async () => {
    assert.doesNotMatch(CONTACT_ACCEPTED_COPY, /доставлен|прочитаємо|надіслано листа/i)
    assert.match(CONTACT_ACCEPTED_COPY, /прийняли/)
    const calls: string[] = []
    const result = await postContactMessage(
      { ...filled, company: '' },
      {
        baseUrl: 'http://127.0.0.1:9/api/public/v1/',
        idempotencyKey: 'contact-key-1',
        fetchImpl: async (input, init) => {
          calls.push(String(input))
          assert.equal(init?.method, 'POST')
          const headers = new Headers(init?.headers)
          assert.equal(headers.get('idempotency-key'), 'contact-key-1')
          const body = JSON.parse(String(init?.body)) as { email: string; company: string }
          assert.equal(body.email, filled.email)
          assert.equal(body.company, '')
          assert.equal('to' in body, false)
          return jsonResponse(200, { status: 'accepted' })
        },
      },
    )
    assert.deepEqual(result, { ok: true })
    assert.equal(calls[0], 'http://127.0.0.1:9/api/public/v1/contact-messages')
  })

  it('keeps the typed values when the network or the server fails', async () => {
    const network = await postContactMessage(
      { ...filled, company: '' },
      {
        baseUrl: 'http://127.0.0.1:9/api/public/v1',
        idempotencyKey: 'contact-key-2',
        fetchImpl: async () => {
          throw new Error('offline')
        },
      },
    )
    const server = await postContactMessage(
      { ...filled, company: '' },
      {
        baseUrl: 'http://127.0.0.1:9/api/public/v1',
        idempotencyKey: 'contact-key-3',
        fetchImpl: async () => jsonResponse(500, { message: 'database password leaked' }),
      },
    )
    const unavailable = await postContactMessage(
      { ...filled, company: '' },
      {
        baseUrl: 'http://127.0.0.1:9/api/public/v1',
        idempotencyKey: 'contact-key-4',
        fetchImpl: async () => jsonResponse(503, { message: 'Brevo stack trace' }),
      },
    )
    assert.equal(network.ok, false)
    assert.equal(server.ok, false)
    assert.equal(unavailable.ok, false)
    if (!network.ok && !server.ok && !unavailable.ok) {
      assert.equal(network.kind, 'network')
      assert.equal(server.kind, 'rejected')
      assert.equal(unavailable.kind, 'unavailable')
      assert.doesNotMatch(contactFailureCopy(server.kind), /password|Brevo|stack/i)
      assert.doesNotMatch(contactFailureCopy(unavailable.kind), /Brevo/)
    }
    assert.deepEqual(fieldsAfterContactResult(filled, false), filled)
    assert.deepEqual(fieldsAfterContactResult(filled, true), { name: '', phone: '', email: '', message: '' })
  })

  it('does not start a second submit while the first is still sending', () => {
    assert.equal(canSubmitContact(false), true)
    assert.equal(canSubmitContact(true), false)
  })

  it('does not report success when the API address is missing', async () => {
    let called = false
    const result = await postContactMessage(
      { ...filled, company: '' },
      {
        baseUrl: null,
        idempotencyKey: 'contact-key-5',
        fetchImpl: async () => {
          called = true
          return jsonResponse(200, { status: 'accepted' })
        },
      },
    )
    assert.deepEqual(result, { ok: false, kind: 'unconfigured' })
    assert.equal(called, false)
  })

  it('removes the local-only success path from the contact page', () => {
    const source = readFileSync(new URL('../pages/ContactPage.tsx', import.meta.url), 'utf8')
    assert.equal(source.includes('localStorage'), false)
    assert.equal(source.includes('dakh-messages'), false)
    assert.match(source, /CONTACT_ACCEPTED_COPY/)
  })
})

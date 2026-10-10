import type { ApiErrorBody } from './types'

export class PublicApiError extends Error {
  readonly statusCode: number
  readonly error: string
  readonly details?: unknown

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'PublicApiError'
    this.statusCode = body.statusCode
    this.error = body.error
    this.details = body.details
  }
}

export function isPublicApiError(value: unknown): value is PublicApiError {
  return value instanceof PublicApiError
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseApiError(status: number, payload: unknown): PublicApiError {
  if (isRecord(payload) && typeof payload.error === 'string' && typeof payload.message === 'string') {
    return new PublicApiError({
      statusCode: typeof payload.statusCode === 'number' ? payload.statusCode : status,
      error: payload.error,
      message: payload.message,
      details: payload.details,
    })
  }

  return new PublicApiError({
    statusCode: status,
    error: status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
    message: status >= 500 ? 'Внутрішня помилка сервера' : 'Некоректна відповідь сервера.',
  })
}

export function errorCopy(error: unknown): string {
  if (isPublicApiError(error)) return error.message
  if (error instanceof Error && error.message === 'PUBLIC_API_NOT_CONFIGURED') {
    return 'Бронювання ще не підключене до сервера. Додайте VITE_PUBLIC_API_BASE_URL.'
  }
  return 'Не вдалося зв’язатися з сервером бронювання.'
}

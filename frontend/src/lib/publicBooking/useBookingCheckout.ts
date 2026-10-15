import { useRef, useState } from 'react'
import { publicBookingClient } from './client'
import { BOOKING_DISABLED_COPY, isBookingEnabled } from './config'
import {
  clearStoredConfirmationToken,
  clearStoredIntent,
  intentLooksExpired,
  isQuoteFresh,
  newIdempotencyKey,
  resumeIntentForStay,
  type CheckoutStep,
  type StoredStay,
  writeStoredConfirmationToken,
  writeStoredIntent,
} from './checkout'
import { errorCopy, isAbortError, isPublicApiError, quoteFromPriceChanged, retryAfterSeconds } from './errors'
import { guestCommentForIntent, toGuestContact } from './guest'
import type {
  PublicBookingConfirmationResponse,
  PublicBookingIntentResponse,
  PublicOtpRequestResponse,
  PublicQuoteResponse,
} from './types'

type GuestInput = {
  firstName: string
  lastName: string
  phone: string
  email: string
  comment?: string
}

export function useBookingCheckout(stay?: StoredStay) {
  const resumed =
    isBookingEnabled() && stay?.roomTypeId && stay.checkIn && stay.checkOut ? resumeIntentForStay(stay) : null
  const [step, setStep] = useState<CheckoutStep>(resumed ? 'verify' : 'collect')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [intent, setIntent] = useState<PublicBookingIntentResponse | null>(resumed)
  const [otp, setOtp] = useState<PublicOtpRequestResponse | null>(null)
  const [pendingQuote, setPendingQuote] = useState<PublicQuoteResponse | null>(null)
  const [priceChangeAt, setPriceChangeAt] = useState<'intent' | 'confirm' | 'email' | null>(null)
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmationResponse | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const inflight = useRef(false)
  const idempotencyKey = useRef(newIdempotencyKey())
  const emailCorrection = useRef('')

  function writesClosed() {
    if (isBookingEnabled()) return false
    setError(BOOKING_DISABLED_COPY)
    return true
  }

  function markCooldown(seconds: number) {
    setCooldownUntil(Date.now() + Math.max(0, seconds) * 1000)
  }

  function resetAttempt() {
    idempotencyKey.current = newIdempotencyKey()
  }

  function resetToCollect() {
    setStep('collect')
    setBusy(false)
    setError('')
    setIntent(null)
    setOtp(null)
    setPendingQuote(null)
    setPriceChangeAt(null)
    setConfirmation(null)
    setCooldownUntil(0)
    inflight.current = false
    emailCorrection.current = ''
    resetAttempt()
    clearStoredIntent()
  }

  async function finishConfirmed(result: PublicBookingConfirmationResponse) {
    if (writesClosed()) return result
    if (result.confirmationToken) writeStoredConfirmationToken(result.confirmationToken)
    const token = result.confirmationToken
    if (!token) {
      setConfirmation(null)
      setStep('looking_up')
      setError('Підтвердження є, але доступ до нього не надійшов. Спробуйте відновити лист.')
      return result
    }
    setStep('looking_up')
    const confirmed = await publicBookingClient.confirmation(token)
    setConfirmation(confirmed)
    setStep('confirmed')
    setError('')
    return confirmed
  }

  async function createIntentFromQuote(quote: PublicQuoteResponse, guest: GuestInput) {
    if (writesClosed()) return null
    setStep('creating_intent')
    setError('')
    const created = await publicBookingClient.createIntent(
      {
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        guestCount: quote.guestCount,
        roomTypeId: quote.roomTypeId,
        ratePlanId: quote.ratePlanId,
        quoteToken: quote.quoteToken,
        acceptedTotalAmount: quote.totalAmount,
        guest: toGuestContact(guest),
        guestComment: guestCommentForIntent(guest.comment ?? ''),
      },
      { idempotencyKey: idempotencyKey.current },
    )
    setIntent(created)
    writeStoredIntent(created, {
      roomTypeId: quote.roomTypeId,
      checkIn: quote.checkIn,
      checkOut: quote.checkOut,
      guestCount: quote.guestCount,
    })
    setPendingQuote(quote)
    setPriceChangeAt(null)
    setStep('verify')
    try {
      const sent = await publicBookingClient.requestEmailVerification(created.intentId)
      setOtp(sent)
      markCooldown(sent.cooldownSeconds)
    } catch (otpError) {
      if (isAbortError(otpError)) throw otpError
      setError(errorCopy(otpError))
      const wait = retryAfterSeconds(otpError)
      if (wait != null) markCooldown(wait)
    }
    return created
  }

  async function startCheckout(quote: PublicQuoteResponse | null, guest: GuestInput) {
    if (writesClosed()) return
    if (inflight.current || busy) return
    if (!isQuoteFresh(quote) || !quote) {
      setError('Розрахунок застарів. Оберіть дати ще раз.')
      return
    }
    inflight.current = true
    setBusy(true)
    try {
      await createIntentFromQuote(quote, guest)
    } catch (caught) {
      if (isAbortError(caught)) return
      const changed = quoteFromPriceChanged(caught)
      if (changed) {
        resetAttempt()
        setPendingQuote(changed)
        setPriceChangeAt('intent')
        setStep('price_changed')
        setError(errorCopy(caught))
        return
      }
      if (isPublicApiError(caught) && caught.error === 'UNAVAILABLE') {
        setStep('unavailable')
        setError(errorCopy(caught))
        setIntent(null)
        clearStoredIntent()
        return
      }
      setStep('collect')
      setError(errorCopy(caught))
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  async function replaceEmail(
    email: string,
    reaccept?: { acceptedTotalAmount: string; quoteToken: string },
  ) {
    if (writesClosed() || !intent) return
    if (intentLooksExpired(intent.expiresAt)) {
      setError('Час на підтвердження минув. Почніть бронювання знову.')
      setStep('collect')
      clearStoredIntent()
      return
    }
    const key = newIdempotencyKey()
    idempotencyKey.current = key
    emailCorrection.current = email.trim()
    const created = await publicBookingClient.correctEmail(
      intent.intentId,
      {
        email: email.trim(),
        acceptedTotalAmount: reaccept?.acceptedTotalAmount,
        quoteToken: reaccept?.quoteToken,
      },
      { idempotencyKey: key },
    )
    emailCorrection.current = ''
    setIntent(created)
    writeStoredIntent(created)
    setPriceChangeAt(null)
    setStep('verify')
    try {
      const sent = await publicBookingClient.requestEmailVerification(created.intentId)
      setOtp(sent)
      markCooldown(sent.cooldownSeconds)
    } catch (otpError) {
      if (isAbortError(otpError)) throw otpError
      setError(errorCopy(otpError))
      const wait = retryAfterSeconds(otpError)
      if (wait != null) markCooldown(wait)
    }
  }

  async function correctEmail(email: string) {
    if (writesClosed()) return
    if (!intent || inflight.current || busy) return
    inflight.current = true
    setBusy(true)
    setError('')
    try {
      await replaceEmail(email)
    } catch (caught) {
      if (isAbortError(caught)) return
      const changed = quoteFromPriceChanged(caught)
      if (changed) {
        emailCorrection.current = email.trim()
        setPendingQuote(changed)
        setPriceChangeAt('email')
        setStep('price_changed')
        setError(errorCopy(caught))
        return
      }
      emailCorrection.current = ''
      if (isPublicApiError(caught) && (caught.error === 'UNAVAILABLE' || caught.error === 'INTENT_EXPIRED' || caught.error === 'INTENT_NOT_FOUND')) {
        setStep(caught.error === 'UNAVAILABLE' ? 'unavailable' : 'collect')
        setError(errorCopy(caught))
        if (caught.error !== 'UNAVAILABLE') {
          setIntent(null)
          clearStoredIntent()
        }
        return
      }
      setStep('verify')
      setError(errorCopy(caught))
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  async function resendCode() {
    if (writesClosed()) return
    if (!intent || inflight.current || Date.now() < cooldownUntil) return
    if (intentLooksExpired(intent.expiresAt)) {
      setError('Час на підтвердження минув. Почніть бронювання знову.')
      setStep('collect')
      return
    }
    inflight.current = true
    setBusy(true)
    setError('')
    try {
      const sent = await publicBookingClient.requestEmailVerification(intent.intentId)
      setOtp(sent)
      markCooldown(sent.cooldownSeconds)
    } catch (caught) {
      if (isAbortError(caught)) return
      setError(errorCopy(caught))
      const wait = retryAfterSeconds(caught)
      if (wait != null) markCooldown(wait)
      if (isPublicApiError(caught) && caught.error === 'INTENT_EXPIRED') {
        setStep('collect')
        clearStoredIntent()
      }
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  async function confirmCode(code: string) {
    if (writesClosed()) return
    if (!intent || inflight.current || busy) return
    inflight.current = true
    setBusy(true)
    setStep('confirming')
    setError('')
    try {
      const result = await publicBookingClient.confirmEmailVerification(intent.intentId, { code: code.trim() })
      await finishConfirmed(result)
    } catch (caught) {
      if (isAbortError(caught)) return
      const changed = quoteFromPriceChanged(caught)
      if (changed) {
        setPendingQuote(changed)
        setPriceChangeAt('confirm')
        setStep('price_changed')
        setError(errorCopy(caught))
        return
      }
      if (isPublicApiError(caught) && caught.error === 'UNAVAILABLE') {
        setStep('unavailable')
        setError(errorCopy(caught))
        return
      }
      setStep('verify')
      setError(errorCopy(caught))
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  async function acceptChangedPrice(guest: GuestInput) {
    if (writesClosed()) return
    if (!pendingQuote || inflight.current || busy) return
    inflight.current = true
    setBusy(true)
    setError('')
    try {
      if (priceChangeAt === 'confirm' && intent) {
        setStep('confirming')
        const result = await publicBookingClient.confirmEmailVerification(intent.intentId, {
          acceptedTotalAmount: pendingQuote.totalAmount,
          quoteToken: pendingQuote.quoteToken,
        })
        await finishConfirmed(result)
        return
      }
      if (priceChangeAt === 'email' && emailCorrection.current) {
        await replaceEmail(emailCorrection.current, {
          acceptedTotalAmount: pendingQuote.totalAmount,
          quoteToken: pendingQuote.quoteToken,
        })
        return
      }
      resetAttempt()
      await createIntentFromQuote(pendingQuote, guest)
    } catch (caught) {
      if (isAbortError(caught)) return
      const changed = quoteFromPriceChanged(caught)
      if (changed) {
        resetAttempt()
        setPendingQuote(changed)
        setStep('price_changed')
        setError(errorCopy(caught))
        return
      }
      if (isPublicApiError(caught) && caught.error === 'UNAVAILABLE') {
        setStep('unavailable')
        setError(errorCopy(caught))
        return
      }
      setError(errorCopy(caught))
      setStep(priceChangeAt === 'confirm' ? 'price_changed' : 'collect')
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  async function loadConfirmation(token: string) {
    if (writesClosed()) return
    setStep('looking_up')
    setBusy(true)
    setError('')
    try {
      const confirmed = await publicBookingClient.confirmation(token)
      setConfirmation(confirmed)
      setStep('confirmed')
    } catch (caught) {
      if (isAbortError(caught)) return
      setConfirmation(null)
      setStep('looking_up')
      setError(errorCopy(caught))
    } finally {
      setBusy(false)
    }
  }

  async function recover(email: string) {
    if (writesClosed()) return false
    if (!intent || inflight.current) return
    inflight.current = true
    setBusy(true)
    setError('')
    try {
      await publicBookingClient.recoverConfirmation(intent.intentId, { email: email.trim() })
      setError('')
      return true
    } catch (caught) {
      if (isAbortError(caught)) return false
      setError(errorCopy(caught))
      const wait = retryAfterSeconds(caught)
      if (wait != null) markCooldown(wait)
      return false
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  return {
    step,
    busy,
    error,
    intent,
    otp,
    pendingQuote,
    priceChangeAt,
    confirmation,
    cooldownUntil,
    startCheckout,
    correctEmail,
    resendCode,
    confirmCode,
    acceptChangedPrice,
    declineChangedPrice: resetToCollect,
    resetToCollect,
    loadConfirmation,
    recover,
    clearConfirmation: clearStoredConfirmationToken,
  }
}

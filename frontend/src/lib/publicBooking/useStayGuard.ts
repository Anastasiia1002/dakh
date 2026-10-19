import { useEffect, useRef, useState } from 'react'
import type { StayRejectionEvent } from './useStaySearch'

const EMPTY = new Set<string>()

/**
 * A quote can still fail after the calendar looked valid. Clear that selection
 * and ask for another date. Do not keep a local block: the refreshed calendar
 * is what decides whether the same day can be chosen again.
 */
export function useStayGuard(rejection: StayRejectionEvent | null, onClear: () => void) {
  const [notice, setNotice] = useState('')
  const seen = useRef(0)
  const onClearRef = useRef(onClear)
  onClearRef.current = onClear

  useEffect(() => {
    if (!rejection || rejection.id === seen.current || rejection.kind === 'guests') return
    seen.current = rejection.id
    setNotice(rejection.message)
    onClearRef.current()
  }, [rejection])

  return {
    blockedCheckIns: EMPTY,
    blockedRanges: EMPTY,
    notice,
    clearNotice: () => setNotice(''),
  }
}

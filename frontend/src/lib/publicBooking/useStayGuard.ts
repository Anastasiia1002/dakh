import { useEffect, useRef, useState } from 'react'
import type { StayRejectionKind } from './errors'
import type { StayRejectionEvent } from './useStaySearch'

const EMPTY = new Set<string>()

/**
 * A failed quote or a room that no longer fits explains itself.
 * The selected dates stay so the guest can change the room or the party.
 */
export function rejectionClearsDates(kind: StayRejectionKind): boolean {
  return kind !== 'check-in' && kind !== 'range' && kind !== 'guests'
}

export function useStayGuard(rejection: StayRejectionEvent | null) {
  const [notice, setNotice] = useState('')
  const seen = useRef(0)

  useEffect(() => {
    if (!rejection || rejection.id === seen.current) return
    seen.current = rejection.id
    setNotice(rejection.message)
  }, [rejection])

  return {
    blockedCheckIns: EMPTY,
    blockedRanges: EMPTY,
    notice,
    clearNotice: () => setNotice(''),
  }
}

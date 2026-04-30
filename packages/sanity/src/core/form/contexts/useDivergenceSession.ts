import {uuid} from '@sanity/uuid'
import {useCallback, useEffect, useRef} from 'react'

import {type DivergenceNavigatorState} from '../../divergence/divergenceNavigator'

interface DivergenceSession {
  beginSession: () => string
}

/**
 * Anchors a divergence-resolution session id on the document the user is
 * inspecting. `beginSession()` mints the id lazily on first call and clears it
 * once the navigator settles with zero divergences.
 *
 * Why a ref rather than `useState`: callers invoke `beginSession()` from
 * inside a `useEffectEvent` and read the returned id synchronously to log
 * telemetry. State setters commit asynchronously, so the first log call would
 * record `sessionId: null`.
 *
 * @internal
 */
export function useDivergenceSession(navigatorState: DivergenceNavigatorState): DivergenceSession {
  const sessionIdRef = useRef<string | null>(null)

  const beginSession = useCallback((): string => {
    if (sessionIdRef.current === null) {
      sessionIdRef.current = uuid()
    }
    return sessionIdRef.current
  }, [])

  // Only clear once the navigator confirms zero divergences via `ready`.
  // `pending` reports zero before collation emits, so clearing there would
  // erase a session before it could be logged.
  const lifecycle = navigatorState.state
  const divergenceCount = navigatorState.divergences.length
  useEffect(() => {
    if (lifecycle === 'ready' && divergenceCount === 0) {
      sessionIdRef.current = null
    }
  }, [lifecycle, divergenceCount])

  return {beginSession}
}

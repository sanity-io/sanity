import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {EMPTY, fromEvent, map, merge, of, timer, timestamp} from 'rxjs'

/** Keeps claimability in sync with expiry, including resume after timer throttling. */
export function useUnclaimedProjectClock(enabled: boolean, expiresAt: Date | undefined): number {
  const [initialNow] = useState(() => Date.now())
  const expiresAtTime = expiresAt?.getTime()
  const clock$ = useMemo(() => {
    if (!enabled) return EMPTY

    return merge(
      of(undefined),
      timer(60_000, 60_000),
      expiresAtTime === undefined ? EMPTY : timer(new Date(expiresAtTime)),
      fromEvent(window, 'focus'),
      fromEvent(document, 'visibilitychange'),
    ).pipe(
      timestamp(),
      map(({timestamp: now}) => now),
    )
  }, [enabled, expiresAtTime])

  return useObservable(clock$, initialNow)
}

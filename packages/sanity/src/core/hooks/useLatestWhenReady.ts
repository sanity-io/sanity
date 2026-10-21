import {useEffect, useState} from 'react'
import {type Observable, ReplaySubject} from 'rxjs'

/**
 * Returns a stable observable that replays the latest `value` passed while `ready` was `true`.
 * Subscribers that arrive before the value is ready wait for it, so work started from an event
 * handler or a state machine actor (which keeps the closure of the render it was created in) runs
 * with the current value instead of the one from that render.
 *
 * @internal
 */
export function useLatestWhenReady<T>(value: T, ready: boolean): Observable<T> {
  const [subject] = useState(() => new ReplaySubject<T>(1))

  useEffect(() => {
    if (ready) subject.next(value)
  }, [subject, value, ready])

  return subject
}

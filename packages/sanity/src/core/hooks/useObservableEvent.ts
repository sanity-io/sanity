import {observableCallback} from 'observable-callback'
import {useEffect, useState} from 'react'
import {type Observable} from 'rxjs'

import {useEffectEvent} from './useEffectEvent'

/**
 * Drop-in replacement for `useObservableEvent` from `react-rx`.
 *
 * react-rx currently uses `use-effect-event` internally, but the next major
 * switches to React's native `useEffectEvent`, which is broken in `forwardRef`
 * and `memo` fibers on React 19.2 (https://github.com/facebook/react/issues/34818).
 * Keep this local copy until that upstream fix ships in a stable React release
 * we can require — `DocumentListPane` is already a `memo` caller.
 *
 * @internal
 */
export function useObservableEvent<T, U>(
  handleEvent: (arg: Observable<T>) => Observable<U>,
): (arg: T) => void {
  const [[calls$, call]] = useState(() => observableCallback<T>())

  const onEvent = useEffectEvent((observable: Observable<T>) => handleEvent(observable))

  useEffect(() => {
    const subscription = calls$.pipe((observable) => onEvent(observable)).subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [calls$])

  return call
}

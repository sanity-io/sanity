import React, {DependencyList, useCallback} from 'react'
import {observableCallback} from 'observable-callback'
import {Observable} from 'rxjs'

export type AsyncCompleteState<T> = {
  status: 'complete'
  result: T
}
export type AsyncPendingState = {
  status: 'pending'
}
export type AsyncErrorState = {
  status: 'error'
  error: Error
}

export type AsyncState<T> = AsyncPendingState | AsyncCompleteState<T> | AsyncErrorState

const EMPTY_DEPS: DependencyList = []

export function useObservableCallback<T, U>(
  fn: (arg: Observable<T>) => Observable<U>,
  dependencies: DependencyList = EMPTY_DEPS
): (arg: T) => void {
  const callbackRef = React.useRef(null)
  if (callbackRef.current === null) {
    callbackRef.current = observableCallback<U>()
  }
  const [calls$, call] = callbackRef.current

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(fn, dependencies)

  React.useEffect(() => {
    const subscription = calls$.pipe(callback).subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [calls$, call, callback])

  return call
}

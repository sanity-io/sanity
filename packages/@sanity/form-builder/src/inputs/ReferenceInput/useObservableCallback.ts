import React from 'react'
import {observableCallback} from 'observable-callback'
import {concat, defer, of, Observable} from 'rxjs'
import {catchError, map, switchMap, tap} from 'rxjs/operators'

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

export function usePreviewSnapshot(id: string, fetchPreviewSnapshot) {
  const [result, setResult] = React.useState({isMissing: false})
  React.useEffect(() => {
    if (id) {
      // return fetchPreviewSnapshot(id).pipe(tap())
    }
  }, [id, fetchPreviewSnapshot])
  return result
}

export function useObservableCallback<T, U>(
  fn: (arg: U) => Observable<T>,
  dependencies: React.DependencyList = [],
  initialState: T | null = null
): [null | T, (arg: U) => void] {
  const [latest, setState] = React.useState<T | null>(initialState)

  const [calls$, call] = observableCallback<U>()

  React.useEffect(() => {
    const subscription = calls$
      .pipe(switchMap((arg: U) => defer(() => fn(arg))))
      .pipe(tap((value: T) => setState(value)))
      .subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [fn, ...dependencies])

  return [latest, call]
}

export function useObservableCallbackWithLoadingState<T, U>(
  fn: (arg: U) => Observable<T>,
  dependencies: React.DependencyList = [],
  initialState: AsyncState<T>
): [null | AsyncState<T>, (arg: U) => void] {
  return useObservableCallback(
    (arg: U) => {
      return concat(
        of({status: 'pending' as const}),
        fn(arg).pipe(
          map((res) => ({status: 'complete' as const, result: res})),
          catchError((err) => of({status: 'error' as const, error: err}))
        )
      )
    },
    dependencies,
    initialState
  )
}

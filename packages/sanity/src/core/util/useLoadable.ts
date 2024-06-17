import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of, type OperatorFunction} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

/** @internal */
export type LoadableState<T> = LoadingState | LoadedState<T> | ErrorState

/** @internal */
export interface LoadingState {
  value: undefined
  error: null
  isLoading: true
}

/** @internal */
export interface LoadedState<T> {
  value: T
  error: null
  isLoading: false
}

/** @internal */
export interface ErrorState {
  value: undefined
  error: Error
  isLoading: false
}

const LOADING_STATE: LoadingState = {
  isLoading: true,
  value: undefined,
  error: null,
}

/** @internal */
export function useLoadable<T>(value$: Observable<T>): LoadableState<T | undefined>
/** @internal */
export function useLoadable<T>(value$: Observable<T>, initialValue: T): LoadableState<T>
/** @internal */
export function useLoadable<T>(
  value$: Observable<T>,
  initialValue?: T,
): LoadableState<T | undefined> {
  const initial: LoadableState<T> =
    typeof initialValue === 'undefined'
      ? LOADING_STATE
      : {isLoading: false, value: initialValue, error: null}

  const loadableObservable = useMemo(() => value$.pipe(asLoadable()), [value$])
  return useObservable(loadableObservable, initial)
}

/** @internal */
export function asLoadable<T>(): OperatorFunction<T, LoadableState<T>> {
  return (value$: Observable<T>) =>
    value$.pipe(
      map((value) => ({isLoading: false, value, error: null}) as const),
      catchError(
        (error): Observable<ErrorState> => of({isLoading: false, value: undefined, error}),
      ),
    )
}

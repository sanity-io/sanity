import {useMemoObservable} from 'react-rx'
import {Observable, of, OperatorFunction} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

export type LoadableState<T> = LoadingState | LoadedState<T> | ErrorState

export interface LoadingState {
  value: undefined
  error: null
  isLoading: true
}

export interface LoadedState<T> {
  value: T
  error: null
  isLoading: false
}

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

export function useLoadable<T>(value$: Observable<T>): LoadableState<T | undefined>
export function useLoadable<T>(value$: Observable<T>, initialValue: T): LoadableState<T>
export function useLoadable<T>(
  value$: Observable<T>,
  initialValue?: T
): LoadableState<T | undefined> {
  const initial: LoadableState<T> =
    typeof initialValue === 'undefined'
      ? LOADING_STATE
      : {isLoading: false, value: initialValue, error: null}

  return useMemoObservable(() => value$.pipe(asLoadable()), [value$], initial)
}

export function asLoadable<T>(): OperatorFunction<T, LoadableState<T>> {
  return (value$: Observable<T>) =>
    value$.pipe(
      map((value) => ({isLoading: false, value, error: null} as const)),
      catchError((error): Observable<ErrorState> => of({isLoading: false, value: undefined, error}))
    )
}

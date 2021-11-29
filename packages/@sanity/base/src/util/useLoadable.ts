import type {Observable, OperatorFunction} from 'rxjs'
import {of} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {catchError, map} from 'rxjs/operators'

export type LoadableState<T> = LoadingState | LoadedState<T> | ErrorState

export interface LoadingState {
  value: undefined
  error: undefined
  isLoading: true
}

export interface LoadedState<T> {
  value: T
  error: undefined
  isLoading: false
}

export interface ErrorState {
  value: undefined
  error: Error
  isLoading: false
}

const LOADING_STATE: LoadingState = {isLoading: true, value: undefined, error: undefined}

export function useLoadable<T>(observable$: Observable<T>): LoadableState<T | undefined>
export function useLoadable<T>(observable$: Observable<T>, initialValue: T): LoadableState<T>
export function useLoadable<T>(
  observable$: Observable<T>,
  initialValue?: T
): LoadableState<T | undefined> {
  const initial: LoadableState<T> =
    typeof initialValue === 'undefined'
      ? LOADING_STATE
      : {isLoading: false, value: initialValue, error: undefined}

  return useMemoObservable(() => observable$.pipe(asLoadable()), [observable$], initial)
}

export function asLoadable<T>(): OperatorFunction<T, LoadableState<T>> {
  return (input$: Observable<T>) =>
    input$.pipe(
      map((val) => ({isLoading: false, value: val, error: undefined} as const)),
      catchError((error): Observable<ErrorState> => of({isLoading: false, value: undefined, error}))
    )
}

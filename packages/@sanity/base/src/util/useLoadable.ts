import {Observable, of, OperatorFunction, Subject} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {catchError, distinctUntilChanged, map, switchMap} from 'rxjs/operators'
import {useEffect, useMemo} from 'react'
import shallowEquals from 'shallow-equals'

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

const LOADING_STATE: LoadingState = {
  isLoading: true,
  value: undefined,
  error: undefined,
}

/**
 * A hook that takes in an observable and "unwraps/flattens" it by subscribing
 * to it and emitting the values as react state wrapped in a `LoadableState`
 * object.
 *
 * @see LoadableState
 */
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

  const result = useMemoObservable(() => observable$.pipe(asLoadable()), [observable$], initial)
  if (result.error) throw result.error
  return result
}

/**
 * An rxjs operator that maps the input observable in a `LoadableState` object
 *
 * @see LoadableState
 */
export function asLoadable<T>(): OperatorFunction<T, LoadableState<T>> {
  return (input$: Observable<T>) =>
    input$.pipe(
      map((val) => ({isLoading: false, value: val, error: undefined} as const)),
      catchError((error): Observable<ErrorState> => of({isLoading: false, value: undefined, error}))
    )
}

// TODO: this hook takes a second to update. ideally it should update
// `isLoading` as soon as arguments are fed into the the observable factory

/**
 * Takes in an observable or a function that returns an observable and returns
 * a `useLoadable` hook.
 *
 * For functions, the arguments are shallow compared before call the function
 * again.
 *
 * @see useLoadable
 */
export function createLoadableHook<T, TArgs extends unknown[] = unknown[]>(
  observableOrFactory: Observable<T> | ((...args: TArgs) => Observable<T>),
  initialValue: T
): (...args: TArgs) => LoadableState<T>
export function createLoadableHook<T, TArgs extends unknown[] = unknown[]>(
  observableOrFactory: Observable<T> | ((...args: TArgs) => Observable<T>)
): (...args: TArgs) => LoadableState<T | undefined>
export function createLoadableHook<T, TArgs extends unknown[] = unknown[]>(
  observableOrFactory: Observable<T> | ((...args: TArgs) => Observable<T>),
  initialValue?: T
): (...args: TArgs) => LoadableState<T | undefined> {
  function useLoadableFromCreateLoadable(...args: TArgs) {
    const subject = useMemo(() => new Subject<TArgs>(), [])

    useEffect(() => {
      if (typeof observableOrFactory === 'function') {
        subject.next(args)
      }
    }, [args, subject])

    const observable$ = useMemo(() => {
      if (typeof observableOrFactory !== 'function') {
        return observableOrFactory
      }

      return subject.pipe(
        distinctUntilChanged((prev, next) => {
          if (prev.length !== next.length) return false

          for (let i = 0; i < next.length; i++) {
            if (!shallowEquals(prev[i], next[i])) return false
          }

          return true
        }),
        switchMap((distinctArgs) => observableOrFactory(...distinctArgs))
      )
    }, [subject])

    return useLoadable(observable$, initialValue)
  }

  return useLoadableFromCreateLoadable
}

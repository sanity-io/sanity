import {useAsObservable, useObservable} from 'react-rx'
import {concat, Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'

type LoadingTuple<T> = [T, boolean]

type ReactHook<TArgs extends unknown[], TResult> = (...args: TArgs) => TResult

interface CreateHookFromObservableFactoryOptions<T, TArgs extends unknown[]> {
  /**
   *
   */
  initialValue: T
  /**
   *
   */
  argsAreEqual?: (prev: TArgs, next: TArgs) => boolean
}

function defaultArgsAreEqual<TArgs extends unknown[]>(prev: TArgs, next: TArgs) {
  if (prev.length !== next.length) return false

  for (let i = 0; i < next.length; i++) {
    if (!shallowEquals(prev[i], next[i])) return false
  }
  return true
}

// overloads to handle types where an initial value is passed
export function createHookFromObservableFactory<T, TArgs extends unknown[]>(
  observableFactory: (...args: TArgs) => Observable<T>,
  options: CreateHookFromObservableFactoryOptions<T, TArgs>
): ReactHook<TArgs, LoadingTuple<T>>
export function createHookFromObservableFactory<T, TArgs extends unknown[]>(
  observableFactory: (...args: TArgs) => Observable<T>,
  options: CreateHookFromObservableFactoryOptions<T | undefined, TArgs>
): ReactHook<TArgs, LoadingTuple<T | undefined>>
export function createHookFromObservableFactory<T, TArgs extends unknown[]>(
  observableFactory: (...args: TArgs) => Observable<T>,
  options?: CreateHookFromObservableFactoryOptions<T | undefined, TArgs>
): ReactHook<TArgs, LoadingTuple<T | undefined>>

/**
 *
 * @param observableFactory
 * @param options
 * @returns
 */
export function createHookFromObservableFactory<T, TArgs extends unknown[]>(
  observableFactory: (...args: TArgs) => Observable<T>,
  options?: CreateHookFromObservableFactoryOptions<T | undefined, TArgs>
): ReactHook<TArgs, LoadingTuple<T | undefined>> {
  const {initialValue, argsAreEqual = defaultArgsAreEqual} = options || {}
  const initialLoadingTuple: LoadingTuple<T | undefined> = [initialValue, true]

  const asLoadingTuple = (args$: Observable<TArgs>) =>
    args$.pipe(
      distinctUntilChanged(argsAreEqual),
      switchMap((distinctArgs) =>
        concat(
          of({type: 'loading'} as const),
          observableFactory(...distinctArgs).pipe(map((value) => ({type: 'value', value} as const)))
        )
      ),
      scan(([prevValue], next): LoadingTuple<T | undefined> => {
        if (next.type === 'loading') return [prevValue, true]
        return [next.value, false]
      }, initialLoadingTuple),
      distinctUntilChanged(([prevValue, prevIsLoading], [nextValue, nextIsLoading]) => {
        if (prevValue !== nextValue) return false
        if (prevIsLoading !== nextIsLoading) return false
        return true
      }),
      map((tuple) => ({type: 'tuple', tuple} as const)),
      catchError((error) => of({type: 'error', error} as const))
    )

  return function useLoadableFromCreateLoadable(...args) {
    const tuple$ = useAsObservable(args, asLoadingTuple)
    const result = useObservable(tuple$, {type: 'tuple', tuple: initialLoadingTuple})

    if (result.type === 'error') throw result.error
    return result.tuple
  }
}

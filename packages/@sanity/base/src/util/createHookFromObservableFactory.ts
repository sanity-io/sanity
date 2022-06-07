import {useAsObservable, useObservable} from 'react-rx'
import {concat, Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import {useUnique} from './useUnique'

export type LoadingTuple<T> = [T, boolean]

type ReactHook<TArgs extends unknown[], TResult> = (...args: TArgs) => TResult

interface CreateHookFromObservableFactoryOptions<T, TArgs extends unknown[]> {
  /**
   * Optionally provide an initial value that will show up initially if the
   * observable resolves asynchronously. Prevents `undefined` as the initial
   * value.
   */
  initialValue: T
  /**
   * Optionally provide a comparison function passed into `distinctUntilEqual`
   * used for args comparison. The default function shallowly compares each
   * argument.
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
 * A function that will create a hook from a function that returns an
 * observable. The parameters of the hook will be the parameters of the function
 * and the return of the hook will be a loading tuple with the value of the
 * observable at the first index and a boolean with the loading state as the
 * second index.
 *
 * The loading state will become true as soon as new incoming args are given and
 * will flip to false when the observable from the function emits the next
 * value.
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
    const _args = useUnique(args)
    const tuple$ = useAsObservable(_args, asLoadingTuple)
    const result = useObservable(tuple$, {type: 'tuple', tuple: initialLoadingTuple})

    if (result.type === 'error') throw result.error

    return result.tuple
  }
}

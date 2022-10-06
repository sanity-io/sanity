import {useMemoObservable} from 'react-rx'
import {concat, Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'
import {useUnique} from './useUnique'

/** @internal */
export type LoadingTuple<T> = [T, boolean]

/** @internal */
export type ReactHook<TArgs, TResult> = (args: TArgs) => TResult

/** @internal */
// overloads to handle types where an initial value is passed
export function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue: T
): ReactHook<TArg, LoadingTuple<T>>
/** @internal */
export function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue?: T
): ReactHook<TArg, LoadingTuple<T | undefined>>

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
 *
 * @internal
 */
export function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue?: T
): ReactHook<TArg, LoadingTuple<T | undefined>> {
  const initialLoadingTuple: LoadingTuple<T | undefined> = [initialValue, true]
  const initialResult = {type: 'tuple', tuple: initialLoadingTuple} as const

  return function useLoadableFromCreateLoadable(_arg: TArg) {
    // @todo refactor callsites to make use of useMemo so that this hook can be removed
    const memoArg = useUnique(_arg)
    const result = useMemoObservable(
      () =>
        of(memoArg).pipe(
          switchMap((arg) =>
            concat(
              of({type: 'loading'} as const),
              observableFactory(arg).pipe(map((value) => ({type: 'value', value} as const)))
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
        ),
      [memoArg],
      initialResult
    )

    if (result.type === 'error') throw result.error

    return result.tuple
  }
}

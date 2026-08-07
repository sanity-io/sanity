import {useMemo} from 'react'
import {useObservable, useSyncObservable} from 'react-rx'
import {concat, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'

/** @internal */
export type LoadingTuple<T> = [T, boolean]

/** @internal */
export type ReactHook<TArgs, TResult> = (args: TArgs) => TResult

/** @internal */
// overloads to handle types where an initial value is passed
export function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue: T,
): ReactHook<TArg, LoadingTuple<T>>
/** @internal */
export function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue?: T,
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
  initialValue?: T,
): ReactHook<TArg, LoadingTuple<T | undefined>> {
  const initialLoadingTuple: LoadingTuple<T | undefined> = [initialValue, true]
  const initialResult = {type: 'tuple', tuple: initialLoadingTuple} as const

  return function useLoadableFromCreateLoadable(arg: TArg) {
    const observable = useMemo(
      () =>
        of(arg).pipe(
          switchMap((_arg) =>
            concat(
              of({type: 'loading'} as const),
              observableFactory(_arg).pipe(map((value) => ({type: 'value', value}) as const)),
            ),
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
          map((tuple) => ({type: 'tuple', tuple}) as const),
          catchError((error) => of({type: 'error', error} as const)),
        ),
      [arg],
    )
    // react-rx v5 defers updates and keeps the deferral identity-coherent: on
    // an identity change (e.g. a new document id) it falls back to the new
    // observable's live value — which synchronously resets to the loading
    // tuple — so the previous arg's value never renders as loaded state for
    // the new one.
    const result = useObservable(observable, initialResult)
    // Throw from the live snapshot so errors reach the error boundary as soon
    // as the observable errors, instead of after the deferred value catches
    // up. Both hooks share one store subscription per observable, so this
    // sync read costs no extra subscription.
    const liveResult = useSyncObservable(observable, initialResult)

    if (liveResult.type === 'error') throw liveResult.error
    // Unreachable within an identity (the deferred value lags the live one,
    // which threw above) and across identities (the identity-coherent
    // deferral falls back to the live value), but it narrows the type.
    if (result.type === 'error') throw result.error

    return result.tuple
  }
}

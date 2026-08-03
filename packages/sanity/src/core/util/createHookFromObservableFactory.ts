import {useDeferredValue, useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
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
    const syncResult = useSyncObservable(observable, initialResult)
    // Identity and result are deferred as one snapshot so they can never tear
    // (the deferred result always belongs to the deferred observable).
    const syncSnapshot = useMemo(() => ({observable, result: syncResult}), [observable, syncResult])
    const deferredSnapshot = useDeferredValue(syncSnapshot)

    // Throw from the live snapshot so errors reach the error boundary as soon
    // as the observable errors, instead of after the deferred snapshot
    // catches up.
    if (syncResult.type === 'error') throw syncResult.error

    // A deferred snapshot is only coherent while it belongs to the current
    // observable identity (same `arg`). Across identity changes (e.g. a new
    // document id) fall back to the live snapshot — which synchronously resets
    // to loading — so the previous arg's value never renders as loaded state
    // for the new one.
    const deferredResult =
      deferredSnapshot.observable === observable ? deferredSnapshot.result : syncResult
    // Defense-in-depth: an error result should never commit (the render that
    // observes it throws above, and recovery remounts with fresh state), so a
    // stale deferred error should be unreachable. But if observable identity
    // is ever cached/reused across an error (e.g. a future factory-level
    // cache), fall back to the live tuple rather than re-throwing it.
    const result = deferredResult.type === 'error' ? syncResult : deferredResult

    return result.tuple
  }
}

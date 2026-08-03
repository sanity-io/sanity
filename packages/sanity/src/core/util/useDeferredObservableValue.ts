import {useDeferredValue, useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {type Observable} from 'rxjs'

/** @internal */
export interface UseDeferredObservableValue {
  <T>(observable: Observable<T>): T | undefined
  <T>(observable: Observable<T>, initialValue: T): T
}

/**
 * Subscribes to an observable like `useSyncObservable`, but returns a deferred
 * snapshot of its value (via `useDeferredValue`) so high-frequency emissions
 * don't force synchronous, blocking renders.
 *
 * Unlike a bare `useDeferredValue(useSyncObservable(...))`, the deferred snapshot
 * is identity-coherent: identity and value are deferred as one object, and
 * when the observable identity changes (e.g. it is memoized on a document id
 * that just changed) the hook falls back to the live value — typically the
 * new observable's initial/loading state — so the previous identity's value
 * never renders under the new one.
 *
 * Values that feed writes, imperative reads, or gating logic paired with live
 * state should use `useSyncObservable` directly instead of this hook.
 *
 * @internal
 */
// Declared as a typed const rather than overloaded function declarations: the
// React Compiler babel transform fails on overloaded hook declarations with a
// "duplicate declaration" error.
export const useDeferredObservableValue: UseDeferredObservableValue =
  function useDeferredObservableValue<T>(observable: Observable<T>, initialValue?: T) {
    const value = useSyncObservable(observable, initialValue as T)
    // Defer identity and value as one snapshot so they can never tear (the
    // deferred value always belongs to the deferred observable).
    const snapshot = useMemo(() => ({observable, value}), [observable, value])
    const deferredSnapshot = useDeferredValue(snapshot)
    return deferredSnapshot.observable === observable ? deferredSnapshot.value : value
  } as UseDeferredObservableValue

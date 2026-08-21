import {useCallback, useEffect, useState} from 'react'
import {type Observable, Subject} from 'rxjs'
import {useEffectEvent} from 'use-effect-event'

/**
 * Returns a stable callback that pushes its argument into an observable pipeline built by
 * `handleEvent`, subscribing the pipeline for the lifetime of the component.
 *
 * This replicates the `useObservableEvent` hook that react-rx removed in v7
 * (https://github.com/sanity-io/react-rx/pull/518), with the semantics our call sites were
 * written against: the pipeline is constructed once per effect mount — via `useEffectEvent`, so
 * it closes over the values from the render that committed — and the returned callback identity
 * never changes.
 *
 * The upstream migration path (own a `Subject`, read the derived stream with `useObservable`)
 * does not fit these call sites: their pipelines close over per-render values (e.g. an
 * `onSearch` prop rebuilt on every render), so memoizing the derived stream on those values
 * would rebuild the pipeline — cancelling in-flight requests and resetting `scan` state — on
 * every render.
 *
 * @internal
 */
export function useObservableEvent<T, K>(
  handleEvent: (arg$: Observable<T>) => Observable<K>,
): (arg: T) => void {
  const [calls$] = useState(() => new Subject<T>())
  // `useEffectEvent` keeps the subscription effect mount-stable while `handleEvent` (typically an
  // inline arrow) changes identity every render. The pipeline is built with the closure from the
  // render that committed the effect — matching react-rx v6 behavior.
  const setupPipeline = useEffectEvent(handleEvent)
  useEffect(() => {
    const subscription = setupPipeline(calls$).subscribe()
    return () => subscription.unsubscribe()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- setupPipeline is a useEffectEvent result: stable identity, and react-hooks/exhaustive-deps errors when effect events are listed as dependencies
  }, [calls$])
  return useCallback(
    (arg: T) => {
      calls$.next(arg)
    },
    [calls$],
  )
}

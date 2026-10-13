import {asapScheduler, EMPTY, from, Observable} from 'rxjs'
import {ignoreElements, observeOn} from 'rxjs/operators'

import {cancelIdleCallback, requestIdleCallback} from './requestIdleCallback'

/**
 * How validation work is paced.
 *
 * - `idle` (default): every rule and nested value waits for a `requestIdleCallback` before it
 *   runs, so validation yields to rendering and input while a document is being edited. A page
 *   that is busy or hidden grants few or no idle periods, so a run can take long to finish.
 * - `immediate`: nothing waits for idle time. The run uses the thread as soon as it can. Where
 *   the browser has `scheduler.yield()`, the run hands the thread back once every
 *   {@link IMMEDIATE_YIELD_EVERY} nodes so that input and rendering get a turn in between;
 *   elsewhere it blocks the main thread for the duration of the synchronous checks. Meant for
 *   the moment a user is waiting on the result, such as publishing.
 *
 * @internal
 */
export type ValidationScheduling = 'idle' | 'immediate'

/**
 * What a validation node waits for before it runs: an observable that completes (without
 * emitting) when the node may go ahead. One pacer is shared by all the nodes of a run.
 *
 * @internal
 */
export type Pace = () => Observable<never>

/**
 * How many nodes an `immediate` run gets through between two `scheduler.yield()` calls. A node
 * is a rule check or a nested value, a few microseconds each for the built-in rules, so this is
 * a yield every millisecond or so of work.
 */
export const IMMEDIATE_YIELD_EVERY = 100

/**
 * What an `immediate` node that does not yield waits for. Never nothing: a gate that completes
 * synchronously lets `mergeMap` recurse through synchronously completing siblings (and nested
 * levels) until the stack overflows, and RxJS drops that error silently. A microtask still runs
 * before paint and input.
 */
const microtask: Observable<never> = EMPTY.pipe(observeOn(asapScheduler))

interface SchedulerLike {
  yield?: () => Promise<void>
}

/** `scheduler.yield()` bound to the scheduler, or `undefined` where the browser has none. */
function getYieldToBrowser(): (() => Promise<void>) | undefined {
  // lib.dom declares `scheduler` on every global object, but Safari and Node have none
  const scheduler = (globalThis as {scheduler?: SchedulerLike}).scheduler
  if (typeof scheduler?.yield !== 'function') return undefined
  return scheduler.yield.bind(scheduler)
}

function idle(): Observable<never> {
  return new Observable<never>((observer) => {
    const handle = requestIdleCallback(() => {
      observer.complete()
    })

    return () => cancelIdleCallback(handle)
  })
}

/**
 * Yields to the browser once every `every` nodes and lets the others through on a microtask.
 * Every node that comes along while the yield is pending waits for that same yield (rather than
 * requesting one of its own, which would let the run carry on around the waiting nodes), and the
 * count starts over when it resolves.
 */
export function createYieldingPace(yieldToBrowser: () => Promise<void>, every: number): Pace {
  let count = 0
  let pending: Observable<never> | undefined
  return () => {
    if (pending) return pending
    count += 1
    if (count < every) return microtask
    count = 0
    const settle = () => {
      if (pending === yielded) pending = undefined
    }
    // a yield that fails (only possible with an aborted signal, which is never passed) lets the
    // run go on rather than fail it
    const yielded: Observable<never> = from(yieldToBrowser().then(settle, settle)).pipe(
      ignoreElements(),
    )
    pending = yielded
    return yielded
  }
}

/** The pacer for one run with the given scheduling. */
export function createPace(scheduling: ValidationScheduling): Pace {
  if (scheduling !== 'immediate') return idle
  const yieldToBrowser = getYieldToBrowser()
  return yieldToBrowser
    ? createYieldingPace(yieldToBrowser, IMMEDIATE_YIELD_EVERY)
    : () => microtask
}

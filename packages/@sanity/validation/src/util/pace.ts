import {asapScheduler, type BehaviorSubject, EMPTY, from, Observable, type Subscription} from 'rxjs'
import {ignoreElements, observeOn} from 'rxjs/operators'

import {cancelIdleCallback, requestIdleCallback} from './requestIdleCallback'

/**
 * How validation work is paced.
 *
 * - `idle` (default): every rule and nested value waits for a `requestIdleCallback` before it
 *   runs, so validation yields to rendering and input while a document is being edited. A page
 *   that is busy or hidden grants few or no idle periods, so a run can take long to finish.
 * - `immediate`: nothing waits for idle time. The run uses the thread as soon as it can, and hands
 *   it back once every {@link IMMEDIATE_YIELD_EVERY} nodes so that input and rendering get a turn
 *   in between: through `scheduler.yield()` where the browser has it, and elsewhere (Safari) by
 *   waiting for the next task. Meant for the moment a user is waiting on the result, such as
 *   publishing.
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
 * How many nodes an `immediate` run gets through between two yields to the browser. A node
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

// lib.dom declares `scheduler` on every global object, but Safari and Node have none, and it
// declares no `setImmediate`, which Node has
interface FeatureDetectedGlobals {
  scheduler?: {yield?: () => Promise<void>}
  setImmediate?: (callback: () => void) => unknown
}

/**
 * How an `immediate` run hands the thread back. `scheduler.yield()` resumes the run ahead of the
 * tasks that were already waiting. Where the browser has none (Safari), the run resumes in a task
 * of its own, behind them, which it gets the way React's scheduler does: from `setImmediate` where
 * there is one (Node), because a `MessageChannel` would keep a Node process alive; otherwise from
 * a `MessageChannel`, because chained timeouts are clamped to 4 ms and throttled in background
 * tabs; and from `setTimeout` as a last resort.
 */
function getYieldToBrowser(): () => Promise<void> {
  const {scheduler, setImmediate} = globalThis as FeatureDetectedGlobals
  if (typeof scheduler?.yield === 'function') return scheduler.yield.bind(scheduler)
  if (typeof setImmediate === 'function') {
    return () => new Promise((resolve) => setImmediate(resolve))
  }
  if (typeof MessageChannel === 'function') return yieldThroughMessageChannel
  return yieldThroughTimeout
}

// One channel for every run, as React's scheduler has. Messages arrive in the order they were
// posted, so each one resolves the yield that has waited longest.
let messagePort: MessagePort | undefined
const waitingForMessage: Array<() => void> = []

function yieldThroughMessageChannel(): Promise<void> {
  if (!messagePort) {
    const channel = new MessageChannel()
    // oxlint-disable-next-line unicorn/prefer-add-event-listener -- unlike addEventListener, this also starts the port
    channel.port1.onmessage = () => waitingForMessage.shift()?.()
    messagePort = channel.port2
  }
  const port = messagePort
  return new Promise((resolve) => {
    waitingForMessage.push(resolve)
    port.postMessage(null)
  })
}

function yieldThroughTimeout(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
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

/**
 * The pacer for one run, `idle` without a scheduling. The scheduling can change while the run is in
 * flight: each node waits the way the scheduling is when its turn comes, and a switch to
 * `immediate` lets the nodes that are waiting for idle time go ahead, so the run picks up speed
 * where it is instead of starting over.
 */
export function createPace(scheduling?: BehaviorSubject<ValidationScheduling>): Pace {
  if (!scheduling) return idle
  const immediate = createYieldingPace(getYieldToBrowser(), IMMEDIATE_YIELD_EVERY)
  const idleUntilImmediate = createIdleUntilImmediate(scheduling)
  return () => (scheduling.getValue() === 'immediate' ? immediate() : idleUntilImmediate())
}

/**
 * Waits for idle time like `idle`, and lets every node still waiting go ahead once the scheduling
 * switches to `immediate`. The waiting nodes share one subscription to the scheduling, held while
 * any of them waits: a subject removes an observer by searching its list for it, so with a
 * subscription each, every node that goes ahead would pay for all the others, and nested arrays can
 * leave tens of thousands of nodes waiting at once.
 */
function createIdleUntilImmediate(scheduling: BehaviorSubject<ValidationScheduling>): Pace {
  const waiting = new Set<() => void>()
  let watching: Subscription | undefined
  const releaseOnImmediate = (mode: ValidationScheduling) => {
    if (mode !== 'immediate') return
    for (const release of waiting) release()
  }
  return () =>
    new Observable<never>((observer) => {
      const release = () => observer.complete()
      waiting.add(release)
      watching ??= scheduling.subscribe(releaseOnImmediate)
      const handle = requestIdleCallback(release)
      return () => {
        cancelIdleCallback(handle)
        waiting.delete(release)
        if (waiting.size > 0) return
        watching?.unsubscribe()
        watching = undefined
      }
    })
}

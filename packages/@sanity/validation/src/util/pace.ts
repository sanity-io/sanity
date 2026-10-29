import {type BehaviorSubject} from 'rxjs'

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

/** What every validation node waits for before it runs. @internal */
export interface Pace {
  wait(signal?: AbortSignal): Promise<void> | undefined
  dispose(): void
}

/** How many nodes an `immediate` run gets through between two yields to the browser. */
export const IMMEDIATE_YIELD_EVERY = 100

const microtask = Promise.resolve()

// lib.dom declares `scheduler` on every global object, but Safari and Node have none, and it
// declares no `setImmediate`, which Node has
interface FeatureDetectedGlobals {
  scheduler?: {yield?: () => Promise<void>}
  setImmediate?: (callback: () => void) => unknown
}

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

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Validation aborted', 'AbortError')
}

function cancelWithSignal(wait: Promise<void>, signal?: AbortSignal): Promise<void> {
  if (!signal) return wait
  if (signal.aborted) return Promise.reject(abortReason(signal))

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(abortReason(signal))
    }
    signal.addEventListener('abort', onAbort, {once: true})
    void wait.then(
      () => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

type IdleWaiter = (reason?: unknown) => void

function waitForIdle(signal: AbortSignal | undefined, waiters?: Set<IdleWaiter>): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    let handle: number | undefined

    const finish: IdleWaiter = (reason) => {
      if (settled) return
      settled = true
      if (handle !== undefined) cancelIdleCallback(handle)
      waiters?.delete(finish)
      signal?.removeEventListener('abort', onAbort)
      if (reason === undefined) resolve()
      else reject(reason)
    }
    const onAbort = () => {
      if (signal) finish(abortReason(signal))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }

    waiters?.add(finish)
    signal?.addEventListener('abort', onAbort, {once: true})
    handle = requestIdleCallback(() => finish())
  })
}

/**
 * Yields to the browser once every `every` nodes and lets the others through on a microtask.
 * Every node that comes along while the yield is pending waits for that same yield.
 */
export function createYieldingPace(yieldToBrowser: () => Promise<void>, every: number): Pace {
  let count = 0
  let pending: Promise<void> | undefined
  return {
    wait(signal) {
      signal?.throwIfAborted()
      if (pending) return cancelWithSignal(pending, signal)
      count += 1
      if (count < every) return cancelWithSignal(microtask, signal)
      count = 0
      const settle = () => {
        if (pending === yielded) pending = undefined
      }
      // A failed browser yield lets validation continue. Cancellation is checked before the next
      // node starts and by every async validator that receives the run's signal.
      const yielded = yieldToBrowser().then(settle, settle)
      pending = yielded
      return cancelWithSignal(yielded, signal)
    },
    dispose() {},
  }
}

/** A pacer for server validation, where yielding to a browser is unnecessary. */
export function createUnpacedPace(): Pace {
  return {
    wait(signal) {
      signal?.throwIfAborted()
      return undefined
    },
    dispose() {},
  }
}

/**
 * The pacer for one Studio run, `idle` without a scheduling. One subscription observes scheduling
 * changes for the whole run rather than creating one RxJS subscription per validation node.
 */
export function createPace(scheduling?: BehaviorSubject<ValidationScheduling>): Pace {
  if (!scheduling) {
    return {
      wait: (signal) => waitForIdle(signal),
      dispose() {},
    }
  }

  let current = scheduling.getValue()
  let disposed = false
  const waiters = new Set<IdleWaiter>()
  const immediate = createYieldingPace(getYieldToBrowser(), IMMEDIATE_YIELD_EVERY)
  const subscription = scheduling.subscribe((next) => {
    current = next
    if (next === 'immediate') {
      for (const release of waiters) release()
    }
  })

  return {
    wait(signal) {
      if (disposed) return Promise.reject(new Error('Validation pace has been disposed'))
      return current === 'immediate' ? immediate.wait(signal) : waitForIdle(signal, waiters)
    },
    dispose() {
      if (disposed) return
      disposed = true
      subscription.unsubscribe()
      for (const release of waiters) release(new Error('Validation pace has been disposed'))
      immediate.dispose()
    },
  }
}

import {delayWhen, from, type MonoTypeOperatorFunction, pipe} from 'rxjs'

/**
 * Delay an observable's emissions, allowing the browser to first complete other higher priority
 * work.
 *
 * @internal
 */
export function delayTask<Type>(): MonoTypeOperatorFunction<Type> {
  if (typeof window?.scheduler !== 'undefined') {
    const {scheduler} = window
    return delayWhen(() => from(scheduler.yield()))
  }

  if (typeof requestIdleCallback === 'function') {
    const idleCallback = new Promise((resolve) => requestIdleCallback(resolve))
    return delayWhen(() => from(idleCallback))
  }

  return pipe()
}

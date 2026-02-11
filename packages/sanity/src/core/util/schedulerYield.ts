/**
 * Schedule the provided callback using `scheduler.yield`, if it's available.
 * This allows long-running work to be broken up so the browser stays responsive.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
 * Otherwise, call it immediately.
 */
export function schedulerYield<Result>(
  promise: () => Promise<Result>,
): Promise<Result> | Promise<void> {
  if ('scheduler' in window && typeof window.scheduler?.yield === 'function') {
    return window.scheduler.yield()
  }
  return promise()
}

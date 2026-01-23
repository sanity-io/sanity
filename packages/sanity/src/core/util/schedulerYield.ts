/**
 * Schedule the provided callback using `scheduler.yield`, if it's available.
 * This allows long-running work to be broken up so the browser stays responsive.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
 * Otherwise, call it immediately.
 */
export function schedulerYield<Result>(
  promise: () => Promise<Result>,
): Promise<Result> | Promise<void> {
  // @ts-expect-error -- Scheduler API types from @types/wicg-task-scheduling not always available in monorepo type checking
  if ('scheduler' in window && typeof window.scheduler?.yield === 'function') {
    // @ts-expect-error -- Scheduler API types from @types/wicg-task-scheduling not always available in monorepo type checking
    return window.scheduler.yield()
  }
  return promise()
}

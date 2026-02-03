/**
 * Schedule the provided callback using `scheduler.postTask`, if it's available.
 * Otherwise, call it immediately.
 */
export function postTask<Result>(
  callback: () => Result,
  // @ts-expect-error -- Scheduler API from @types/wicg-task-scheduling not available in all TS contexts
  options: PostTaskOptions = {},
): Result | Promise<Result> {
  // @ts-expect-error -- Scheduler API from @types/wicg-task-scheduling not available in all TS contexts
  if ('scheduler' in window && typeof window.scheduler?.postTask === 'function') {
    // @ts-expect-error -- Scheduler API from @types/wicg-task-scheduling not available in all TS contexts
    return window.scheduler.postTask(callback, options)
  }
  return callback()
}

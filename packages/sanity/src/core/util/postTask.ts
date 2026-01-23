/**
 * Schedule the provided callback using `scheduler.postTask`, if it's available.
 * Otherwise, call it immediately.
 */
export function postTask<Result>(
  callback: () => Result,
  // @ts-expect-error -- Scheduler API types from @types/wicg-task-scheduling not always available in monorepo type checking
  options: PostTaskOptions = {},
): Result | Promise<Result> {
  // @ts-expect-error -- Scheduler API types from @types/wicg-task-scheduling not always available in monorepo type checking
  if ('scheduler' in window && typeof window.scheduler?.postTask === 'function') {
    // @ts-expect-error -- Scheduler API types from @types/wicg-task-scheduling not always available in monorepo type checking
    return window.scheduler.postTask(callback, options)
  }
  return callback()
}

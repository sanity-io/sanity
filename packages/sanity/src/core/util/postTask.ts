/**
 * Schedule the provided callback using `scheduler.postTask`, if it's available.
 * Otherwise, call it immediately.
 */
export function postTask<Result>(
  callback: () => Result,
  options: PostTaskOptions = {},
): Result | Promise<Result> {
  if ('scheduler' in window && typeof window.scheduler?.postTask === 'function') {
    return window.scheduler.postTask(callback, options)
  }
  return callback()
}

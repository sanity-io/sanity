export function scheduledYield<Result>(
  promise: () => Promise<Result>,
): Promise<Result> | Promise<void> {
  if ('scheduler' in window && typeof window.scheduler?.yield === 'function') {
    return window.scheduler.yield()
  }
  return promise()
}

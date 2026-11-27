/**
 * The History API answers with a 429 once a project and dataset have 10 requests in flight, so
 * every history read made per table row takes a slot here and the rows share one budget. The
 * slots left over are for the history reads that don't go through this limiter, such as the
 * document pane's events.
 *
 * @internal
 */
export const HISTORY_MAX_CONCURRENT_REQUESTS = 8

let activeRequests = 0
const waitingRequests: Array<() => void> = []

function acquireSlot(): Promise<void> {
  if (activeRequests < HISTORY_MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => waitingRequests.push(resolve))
}

function releaseSlot(): void {
  const next = waitingRequests.shift()
  if (next) {
    // The slot passes straight to the next waiting request, so a request made before that one
    // resumes can't take it as well.
    next()
    return
  }
  activeRequests -= 1
}

/**
 * Runs `request` once a History API slot is free, and frees the slot when it settles. Requests
 * that have to wait start in the order they were made.
 *
 * @internal
 */
export async function runWithHistoryRequestSlot<T>(request: () => Promise<T>): Promise<T> {
  await acquireSlot()
  try {
    return await request()
  } finally {
    releaseSlot()
  }
}

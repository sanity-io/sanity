import {getOldestPendingRequest, subscribePendingRequests} from './listenerCount'
import {setStalled} from './studioTabs'

/**
 * How long the oldest pending request can go without response headers before it counts as
 * stalled behind the connection limit - above normal connect time, below the client's own
 * restart.
 *
 * @internal
 */
export const LISTENER_STALL_TRIGGER_MS = 10_000

const BOOT_STALL_URL_MARKER = '/users/me'

/** @internal */
export interface DetectedStall {
  isBootStall: boolean
  stallOccurrence: number
  stalledForMs: number
}

interface PendingRequest {
  url: string
  startedAt: number
}

const stallDetectorState: {
  isStalled: boolean
  stallOccurrence: number
  timer: ReturnType<typeof setTimeout> | undefined
} = {
  isStalled: false,
  stallOccurrence: 0,
  timer: undefined,
}

const stallSubscribers = new Set<(stall: DetectedStall) => void>()

/**
 * Calls `subscriber` each time a request is found to have gone past {@link LISTENER_STALL_TRIGGER_MS}
 * with no response headers yet. One stall is tracked at a time - two requests stalling together
 * still produce exactly one call. A later stall, once this tab's pending requests have cleared,
 * is a new occurrence.
 *
 * @internal
 */
export function subscribeListenerStall(subscriber: (stall: DetectedStall) => void): () => void {
  stallSubscribers.add(subscriber)
  return () => {
    stallSubscribers.delete(subscriber)
  }
}

// Module-level, not a component: every request through the counting fetch passes here
// regardless of what is mounted, so a tab hung above `ActiveWorkspaceMatcher` is still watched.
subscribePendingRequests(reschedule)

function reschedule(): void {
  clearTimeout(stallDetectorState.timer)
  const oldestPending = getOldestPendingRequest()
  if (!oldestPending) {
    clearStall()
    return
  }

  const remainingMs = LISTENER_STALL_TRIGGER_MS - (Date.now() - oldestPending.startedAt)
  if (remainingMs <= 0) {
    detectStall(oldestPending)
    return
  }

  clearStall()
  stallDetectorState.timer = setTimeout(reschedule, remainingMs)
}

function detectStall(oldestPending: PendingRequest): void {
  if (stallDetectorState.isStalled) return
  stallDetectorState.isStalled = true
  stallDetectorState.stallOccurrence += 1
  setStalled(true)

  const stall: DetectedStall = {
    isBootStall: oldestPending.url.includes(BOOT_STALL_URL_MARKER),
    stallOccurrence: stallDetectorState.stallOccurrence,
    stalledForMs: Date.now() - oldestPending.startedAt,
  }
  stallSubscribers.forEach((subscriber) => subscriber(stall))
}

function clearStall(): void {
  if (!stallDetectorState.isStalled) return
  stallDetectorState.isStalled = false
  setStalled(false)
}

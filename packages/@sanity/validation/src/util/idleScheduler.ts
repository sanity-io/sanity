import {Observable} from 'rxjs'

import {cancelIdleCallback, requestIdleCallback} from './requestIdleCallback'

/**
 * How long a scheduler waits for the browser to grant an idle period before it runs a slice
 * anyway. A page that is busy rendering a large form rarely goes idle, and a page in a background
 * tab is granted no idle periods at all, so without a timeout validation can stall indefinitely.
 */
const IDLE_TIMEOUT_MS = 250

/**
 * Length of a slice that runs because the idle timeout expired rather than because the browser was
 * idle. The main thread is busy with other work at that point, so take about a frame and yield.
 */
const TIMED_OUT_SLICE_MS = 16

/**
 * Hands out turns to run validation work without monopolising the main thread.
 * @internal
 */
export interface ValidationScheduler {
  /**
   * Completes once the subscriber may run its work. Completes synchronously while the current
   * idle slice has time left (or the document is hidden, where there is nothing to stay out of the
   * way of), otherwise parks the subscriber until the next slice.
   */
  yield(): Observable<never>
}

interface IdleSchedulerOptions {
  requestIdleCallback?: typeof requestIdleCallback
  cancelIdleCallback?: typeof cancelIdleCallback
  isDocumentHidden?: () => boolean
  now?: () => number
}

function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

const now: () => number =
  typeof performance === 'undefined' ? () => Date.now() : () => performance.now()

/**
 * Time-slices validation work over the browser's idle periods.
 *
 * One `requestIdleCallback` is pending per scheduler, not one per piece of work. When it fires,
 * parked work is released in FIFO order for as long as the idle deadline has time left, and work
 * that becomes ready while a slice is still running (for example a sibling that is started when
 * the previous one completes) runs in the same slice instead of waiting for another idle period.
 * The number of idle periods a validation run needs therefore scales with its CPU cost, not with
 * the number of nodes in the document.
 *
 * The idle request carries a timeout, so a page that never goes idle still progresses in short
 * slices, and a hidden document runs its work without yielding at all: the browser grants no idle
 * periods to a background tab, and there is no rendering to stay out of the way of.
 */
export class IdleScheduler implements ValidationScheduler {
  private readonly parked = new Set<() => void>()
  private readonly requestIdle: typeof requestIdleCallback
  private readonly cancelIdle: typeof cancelIdleCallback
  private readonly isHidden: () => boolean
  private readonly now: () => number
  private handle: number | undefined
  private hasBudget: (() => boolean) | undefined
  private draining = false

  constructor(options: IdleSchedulerOptions = {}) {
    this.requestIdle = options.requestIdleCallback ?? requestIdleCallback
    this.cancelIdle = options.cancelIdleCallback ?? cancelIdleCallback
    this.isHidden = options.isDocumentHidden ?? isDocumentHidden
    this.now = options.now ?? now
  }

  yield(): Observable<never> {
    return new Observable<never>((observer) => {
      if (this.canRunNow()) {
        observer.complete()
        return undefined
      }

      const release = () => observer.complete()
      this.parked.add(release)
      this.ensureScheduled()

      return () => {
        if (this.parked.delete(release) && this.parked.size === 0) {
          this.cancelScheduled()
        }
      }
    })
  }

  private canRunNow(): boolean {
    return this.isHidden() || this.hasBudget?.() === true
  }

  private ensureScheduled(): void {
    if (this.handle !== undefined || this.draining) return
    this.handle = this.requestIdle((deadline) => this.drain(deadline), {timeout: IDLE_TIMEOUT_MS})
  }

  private cancelScheduled(): void {
    if (this.handle === undefined) return
    this.cancelIdle(this.handle)
    this.handle = undefined
  }

  private drain(deadline: IdleDeadline): void {
    this.handle = undefined
    this.hasBudget = this.createBudget(deadline)
    this.draining = true
    try {
      // Always release at least one task so that a zero-length idle period still makes progress.
      do {
        const next = this.parked.values().next()
        if (next.done) break
        this.parked.delete(next.value)
        next.value()
      } while (this.hasBudget())
    } finally {
      this.draining = false
      if (this.parked.size > 0) this.ensureScheduled()
    }
  }

  private createBudget(deadline: IdleDeadline): () => boolean {
    if (this.isHidden()) {
      return () => this.isHidden()
    }
    if (deadline.didTimeout) {
      const end = this.now() + TIMED_OUT_SLICE_MS
      return () => this.now() < end
    }
    return () => deadline.timeRemaining() > 0
  }
}

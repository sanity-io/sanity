/** The scheduler is capable of executing work in different ways. */
export type Scheduler = {
  map<T, U>(arr: T[], fn: (val: T) => U): Promise<U[]>
  forEach<T>(arr: T[], fn: (val: T) => void): Promise<void>
  forEachIter<T>(iter: Iterable<T>, fn: (val: T) => void): Promise<void>
}

/**
 * How long we're willing to do work before invoking the idle callback.
 * This is set to 50% of the budget of maintaining 60 FPS.
 */
const MAX_IDLE_WORK = 0.5 * (1000 / 60)

/** A scheduler which uses an idle callback to process work. */
export class IdleScheduler implements Scheduler {
  #durations: number[] = []
  #lastAwake: number

  constructor(durations: number[]) {
    this.#lastAwake = performance.now()
    this.#durations = durations
  }

  async map<T, U>(arr: T[], fn: (val: T) => U): Promise<U[]> {
    const result: U[] = []
    for (const val of arr) {
      const pause = this._tryPause()
      if (pause) await pause
      result.push(fn(val))
    }
    return result
  }

  async forEach<T>(arr: T[], fn: (val: T) => void): Promise<void> {
    for (const val of arr) {
      const pause = this._tryPause()
      if (pause) await pause
      fn(val)
    }
  }

  async forEachIter<T>(iter: Iterable<T>, fn: (val: T) => void): Promise<void> {
    for (const val of iter) {
      const pause = this._tryPause()
      if (pause) await pause
      fn(val)
    }
  }

  /** Should be invoked at the end to also measure the last pause. */
  end() {
    this.#durations.push(performance.now() - this.#lastAwake)
  }

  /**
   * Yields control back to the UI.
   */
  private _tryPause(): Promise<void> | undefined {
    // Record how much time we've used so far:
    const now = performance.now()
    const elapsed = now - this.#lastAwake
    if (elapsed < MAX_IDLE_WORK) {
      // We're willing to do more work!
      return undefined
    }

    this.#durations.push(elapsed)

    return new Promise((resolve) => {
      const done = () => {
        this.#lastAwake = performance.now()
        resolve()
      }

      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(done, {timeout: 1})
      } else if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(done)
      } else {
        setTimeout(done, 0)
      }
    })
  }
}

/** A scheduler which does the work as synchronous as possible. */
export const SYNC_SCHEDULER: Scheduler = {
  async map<T, U>(arr: T[], fn: (val: T) => U): Promise<U[]> {
    return arr.map(fn)
  },

  async forEach<T>(arr: T[], fn: (val: T) => void): Promise<void> {
    return arr.forEach(fn)
  },

  async forEachIter<T>(iter: Iterable<T>, fn: (val: T) => void): Promise<void> {
    for (const val of iter) {
      fn(val)
    }
  },
}

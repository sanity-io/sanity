type Pending = {
  resolve: () => void
  reject: (reason?: unknown) => void
  signal?: AbortSignal
  onAbort: () => void
}

/**
 * ConcurrencyLimiter manages the number of concurrent operations that can be performed.
 * It ensures that the number of operations does not exceed a specified maximum limit.
 */
export class ConcurrencyLimiter {
  current = 0
  resolvers = new Set<Pending>()
  public max: number
  constructor(max: number) {
    this.max = max
  }

  /**
   * Indicates when a slot for a new operation is ready.
   * If under the limit, it resolves immediately; otherwise, it waits until a slot is free.
   */
  ready = (signal?: AbortSignal): Promise<void> => {
    if (signal?.aborted) return Promise.reject(signal.reason)
    if (this.max === Infinity) return Promise.resolve()

    if (this.current < this.max) {
      this.current++
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const pending = {resolve, reject, signal, onAbort: () => {}}
      pending.onAbort = () => {
        if (this.resolvers.delete(pending) && signal) reject(signal.reason)
      }
      signal?.addEventListener('abort', pending.onAbort, {once: true})
      this.resolvers.add(pending)
    })
  }

  /** Runs an operation when a concurrency slot is available. */
  run = async <T>(work: () => PromiseLike<T> | T, signal?: AbortSignal): Promise<T> => {
    await this.ready(signal)
    try {
      signal?.throwIfAborted()
      return await work()
    } finally {
      this.release()
    }
  }

  /**
   * Releases a slot, decrementing the current count of operations if nothing is in the queue.
   * If there are operations waiting, it allows the next one in the queue to proceed.
   */
  release = (): void => {
    if (this.max === Infinity) return

    let next = this.resolvers.values().next().value
    while (next) {
      this.resolvers.delete(next)
      next.signal?.removeEventListener('abort', next.onAbort)
      if (next.signal?.aborted) {
        next.reject(next.signal.reason)
        next = this.resolvers.values().next().value
        continue
      }
      next.resolve()
      return
    }

    this.current = Math.max(0, this.current - 1)
  }
}

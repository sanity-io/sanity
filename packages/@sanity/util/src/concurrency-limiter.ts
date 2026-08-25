/**
 * ConcurrencyLimiter manages the number of concurrent operations that can be performed.
 * It ensures that the number of operations does not exceed a specified maximum limit.
 */
export class ConcurrencyLimiter {
  current = 0
  resolvers: Array<{
    resolve: () => void
    reject: (reason?: unknown) => void
    signal?: AbortSignal
    onAbort: () => void
  }> = []
  public max: number
  constructor(max: number) {
    this.max = max
  }

  /**
   * Indicates when a slot for a new operation is ready.
   * If under the limit, it resolves immediately; otherwise, it waits until a slot is free.
   */
  ready = (signal?: AbortSignal): Promise<void> => {
    if (signal?.aborted) return Promise.reject(getAbortReason(signal))
    if (this.max === Infinity) return Promise.resolve()

    if (this.current < this.max) {
      this.current++
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const pending = {resolve, reject, signal, onAbort: () => {}}
      pending.onAbort = () => {
        const index = this.resolvers.indexOf(pending)
        if (index !== -1) this.resolvers.splice(index, 1)
        if (signal) reject(getAbortReason(signal))
      }
      signal?.addEventListener('abort', pending.onAbort, {once: true})
      this.resolvers.push(pending)
    })
  }

  /**
   * Releases a slot, decrementing the current count of operations if nothing is in the queue.
   * If there are operations waiting, it allows the next one in the queue to proceed.
   */
  release = (): void => {
    if (this.max === Infinity) return

    let next = this.resolvers.shift()
    while (next) {
      next.signal?.removeEventListener('abort', next.onAbort)
      if (next.signal?.aborted) {
        next.reject(getAbortReason(next.signal))
        next = this.resolvers.shift()
        continue
      }
      next.resolve()
      return
    }

    this.current = Math.max(0, this.current - 1)
  }
}

function getAbortReason(signal: AbortSignal): unknown {
  return signal.reason === undefined
    ? new DOMException('The operation was aborted', 'AbortError')
    : signal.reason
}

/** @internal */
export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw getAbortReason(signal)
}

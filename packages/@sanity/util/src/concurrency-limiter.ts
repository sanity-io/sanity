/**
 * ConcurrencyLimiter manages the number of concurrent operations that can be performed.
 * It ensures that the number of operations does not exceed a specified maximum limit.
 */
export class ConcurrencyLimiter {
  current = 0
  resolvers: Array<() => void> = []
  constructor(public max: number) {}

  /**
   * Indicates when a slot for a new operation is ready.
   * If under the limit, it resolves immediately; otherwise, it waits until a slot is free.
   */
  ready = (): Promise<void> => {
    if (this.max === Infinity) return Promise.resolve()

    if (this.current < this.max) {
      this.current++
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.resolvers.push(resolve)
    })
  }

  /**
   * Releases a slot, decrementing the current count of operations if nothing is in the queue.
   * If there are operations waiting, it allows the next one in the queue to proceed.
   */
  release = (): void => {
    if (this.max === Infinity) return

    const nextResolver = this.resolvers.shift()
    if (nextResolver) {
      nextResolver()
      return
    }

    this.current = Math.max(0, this.current - 1)
  }
}

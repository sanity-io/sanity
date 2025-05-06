/**
 * Implements an asynchronous queue pattern. Allows enqueueing items,
 * consuming them via an async iterator, and signaling completion or errors.
 */
export class AsyncQueue<T> {
  // Internal state:
  // `queue`: Holds items yet to be consumed.
  // `resume`: A callback to signal the consumer when new items arrive or the queue finishes/errors.
  // `finished`: Flag indicating if the producer is done adding items (via `finish` or `throwError`).
  // `pendingError`: Stores an error passed to `throwError`, to be thrown by the consumer.
  private queue: T[] = []
  private resume: (() => void) | null = null
  private finished = false
  private pendingError: unknown = null

  /**
   * Enqueues an item. Throws if `finish` or `throwError` has been called.
   */
  public enqueue(item: T): void {
    if (this.finished) {
      throw new Error('Cannot enqueue items to a finished AsyncQueue.')
    }
    this.queue.push(item)
    // If the iterator is waiting, resume it.
    if (this.resume) {
      this.resume()
      this.resume = null
    }
  }

  /**
   * Signals that no more items will be enqueued. Idempotent.
   */
  public finish(): void {
    if (!this.finished) {
      this.finished = true
      // If the iterator is waiting, resume it.
      if (this.resume) {
        this.resume()
        this.resume = null
      }
    }
  }

  /**
   * Signals an error occurred during production. Finishes the queue. Idempotent.
   */
  public throwError(error: unknown): void {
    if (!this.finished) {
      this.pendingError = error
      this.finished = true
      // If the iterator is waiting, resume it.
      if (this.resume) {
        this.resume()
        this.resume = null
      }
    }
  }

  /**
   * Async iterator to consume enqueued items.
   * Throws if `throwError` was called.
   */
  public async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    while (true) {
      // Throw immediately if an error occurred before or during waiting.
      if (this.pendingError) {
        throw this.pendingError
      }

      // Wait for new items if the queue is empty and not finished.
      if (this.queue.length === 0 && !this.finished) {
        await new Promise<void>((resolve) => {
          this.resume = resolve
        })
        // Re-check for errors after resuming, as `throwError` could have been called
        // while we were waiting.
        if (this.pendingError) {
          throw this.pendingError
        }
      }

      // Yield available items.
      while (this.queue.length > 0) {
        // `!` is safe because `this.queue.length > 0`.
        yield this.queue.shift()!
      }

      // If finished and queue is empty, the loop is done.
      if (this.finished && this.queue.length === 0) {
        break
      }
    }
    // Final check for errors, in case `throwError` was called after the last item
    // was yielded but before the loop condition was checked again.
    if (this.pendingError) {
      throw this.pendingError
    }
  }
}

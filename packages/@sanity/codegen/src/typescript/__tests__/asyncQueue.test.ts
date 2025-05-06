import {describe, expect, it} from 'vitest'

import {AsyncQueue} from '../asyncQueue'

describe('AsyncQueue', () => {
  it('should enqueue and yield items sequentially', async () => {
    const queue = new AsyncQueue<number>()
    const results: number[] = []

    queue.enqueue(1)
    queue.enqueue(2)
    queue.finish()

    for await (const item of queue) {
      results.push(item)
    }

    expect(results).toEqual([1, 2])
  })

  it('should wait for items if queue is empty', async () => {
    const queue = new AsyncQueue<string>()
    const results: string[] = []
    let iterationStarted = false

    const consumePromise = (async () => {
      iterationStarted = true
      for await (const item of queue) {
        results.push(item)
      }
    })()

    // Give the consumer a chance to start and wait
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(iterationStarted).toBe(true)
    expect(results).toEqual([])

    queue.enqueue('hello')
    await new Promise((resolve) => setTimeout(resolve, 0)) // Allow iteration to proceed
    expect(results).toEqual(['hello'])

    queue.enqueue('world')
    queue.finish()

    await consumePromise // Wait for the consumer to finish
    expect(results).toEqual(['hello', 'world'])
  })

  it('should handle finish before iteration starts', async () => {
    const queue = new AsyncQueue<number>()
    const results: number[] = []

    queue.enqueue(1)
    queue.finish()

    for await (const item of queue) {
      results.push(item)
    }

    expect(results).toEqual([1])
  })

  it('should handle finish during iteration', async () => {
    const queue = new AsyncQueue<number>()
    const results: number[] = []

    queue.enqueue(1)
    queue.enqueue(2)

    const consumePromise = (async () => {
      for await (const item of queue) {
        results.push(item)
        if (item === 1) {
          queue.finish() // Finish after consuming the first item
        }
      }
    })()

    await consumePromise
    expect(results).toEqual([1, 2])
  })

  it('should throw error if enqueue is called after finish', () => {
    const queue = new AsyncQueue<number>()
    queue.finish()
    expect(() => queue.enqueue(1)).toThrow('Cannot enqueue items to a finished AsyncQueue.')
  })

  it('should throw error if enqueue is called after throwError', () => {
    const queue = new AsyncQueue<number>()
    queue.throwError(new Error('Producer error'))
    expect(() => queue.enqueue(1)).toThrow('Cannot enqueue items to a finished AsyncQueue.')
  })

  it('should throw the specified error during iteration when throwError is called', async () => {
    const queue = new AsyncQueue<number>()
    const testError = new Error('Test producer error')
    const results: number[] = []

    queue.enqueue(1)

    const consumePromise = (async () => {
      for await (const item of queue) {
        results.push(item)
      }
    })()

    // Allow the first item to be consumed
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(results).toEqual([1])

    queue.throwError(testError)

    await expect(consumePromise).rejects.toThrow(testError)
    expect(results).toEqual([1]) // Ensure no more items were processed
  })

  it('should throw immediately if throwError is called before iteration starts', async () => {
    const queue = new AsyncQueue<number>()
    const testError = new Error('Immediate error')

    queue.throwError(testError)

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of queue) {
        // no-op
      }
    }).rejects.toThrow(testError)
  })

  it('should throw if throwError is called while consumer is waiting', async () => {
    const queue = new AsyncQueue<number>()
    const testError = new Error('Error while waiting')
    let consumed = false

    const consumePromise = (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of queue) {
          consumed = true
        }
      } catch (err) {
        expect(err).toBe(testError)
        throw err // Re-throw for the outer expect
      }
    })()

    // Give the consumer time to start waiting
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(consumed).toBe(false) // Should be waiting

    queue.throwError(testError)

    await expect(consumePromise).rejects.toThrow(testError)
    expect(consumed).toBe(false)
  })

  it('finish should be idempotent', async () => {
    const queue = new AsyncQueue<number>()
    queue.enqueue(1)
    queue.finish()
    queue.finish() // Call again

    const results: number[] = []
    for await (const item of queue) {
      results.push(item)
    }
    expect(results).toEqual([1])
    expect(() => queue.enqueue(2)).toThrow() // Still finished
  })

  it('throwError should be idempotent', async () => {
    const queue = new AsyncQueue<number>()
    const error1 = new Error('Error 1')
    const error2 = new Error('Error 2')

    queue.throwError(error1)
    queue.throwError(error2) // Call again with a different error

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of queue) {
        // no-op
      }
    }).rejects.toThrow(error1) // Should throw the first error
    expect(() => queue.enqueue(1)).toThrow() // Still finished
  })

  it('calling finish after throwError should not change the error state', async () => {
    const queue = new AsyncQueue<number>()
    const testError = new Error('Error first')

    queue.throwError(testError)
    queue.finish() // Should have no effect

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of queue) {
        // no-op
      }
    }).rejects.toThrow(testError)
    expect(() => queue.enqueue(1)).toThrow()
  })

  it('calling throwError after finish should not override the finished state', async () => {
    const queue = new AsyncQueue<number>()
    const testError = new Error('Error later')

    queue.enqueue(1)
    queue.finish()
    queue.throwError(testError) // Should have no effect

    const results: number[] = []
    const consumePromise = (async () => {
      for await (const item of queue) {
        results.push(item)
      }
    })()

    await expect(consumePromise).resolves.toBeUndefined() // Should complete normally

    expect(results).toEqual([1])
    expect(() => queue.enqueue(2)).toThrow() // Still finished
  })

  it('should handle rapid enqueue/consume/finish cycles', async () => {
    const queue = new AsyncQueue<number>()
    const limit = 10
    const results: number[] = []

    const consumePromise = (async () => {
      for await (const item of queue) {
        results.push(item)
      }
    })()

    for (let i = 0; i < limit; i++) {
      queue.enqueue(i)
    }
    queue.finish()

    await consumePromise
    expect(results).toEqual(Array.from({length: limit}, (_, i) => i))
  })
})

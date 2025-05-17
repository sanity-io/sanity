import {EventEmitter} from 'node:events'
import {type MessagePort, type Worker} from 'node:worker_threads'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createReceiver,
  createReporter,
  type WorkerChannel,
  type WorkerChannelEvent,
  type WorkerChannelStream,
} from '../workerChannel'

// Define a sample worker channel for testing
type TestWorkerChannel = WorkerChannel<{
  simpleEvent: WorkerChannelEvent<string>
  dataEvent: WorkerChannelEvent<{id: number; value: boolean}>
  simpleStream: WorkerChannelStream<number>
  endStream: WorkerChannelStream<void>
}>

// Mock Worker and MessagePort
class MockWorker extends EventEmitter {
  terminated = false
  terminate = vi.fn(async () => {
    this.terminated = true
    return 0
  })
  postMessage = vi.fn((message: unknown) => {
    this.emit('message', message)
  })

  // Helper to simulate receiving a message from the parent (if needed)
  receiveMessage(message: unknown) {
    this.emit('message', message)
  }

  // Helper to simulate an error from the worker
  emitError(error: unknown) {
    this.emit('error', error)
  }
}

class MockMessagePort extends EventEmitter {
  postMessage = vi.fn((message: unknown) => {
    // Simulate the message being sent back to the parent/receiver
    // In a real scenario, this would go to the Worker's listener
    mockWorkerInstance?.receiveMessage(message)
  })

  // Helper to simulate receiving a message (e.g., from the parent)
  receiveMessage(message: unknown) {
    this.emit('message', message)
  }
}

let mockWorkerInstance: MockWorker
let mockParentPortInstance: MockMessagePort
let receiver: ReturnType<typeof createReceiver<TestWorkerChannel>>
let reporter: ReturnType<typeof createReporter<TestWorkerChannel>>

beforeEach(() => {
  mockWorkerInstance = new MockWorker()
  mockParentPortInstance = new MockMessagePort()
  receiver = createReceiver<TestWorkerChannel>(mockWorkerInstance as unknown as Worker)
  reporter = createReporter<TestWorkerChannel>(mockParentPortInstance as unknown as MessagePort)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('workerChannel', () => {
  it('should send and receive a simple event', async () => {
    const receivedPromise = receiver.event.simpleEvent()
    reporter.event.simpleEvent('hello')

    await expect(receivedPromise).resolves.toBe('hello')
  })

  it('should send and receive an event with data object', async () => {
    const payload = {id: 123, value: true}
    const receivedPromise = receiver.event.dataEvent()
    reporter.event.dataEvent(payload)

    await expect(receivedPromise).resolves.toEqual(payload)
  })

  it('should send and receive a stream of data', async () => {
    const receivedItems: number[] = []
    const streamPromise = (async () => {
      for await (const item of receiver.stream.simpleStream()) {
        receivedItems.push(item)
      }
    })()

    reporter.stream.simpleStream.emit(1)
    reporter.stream.simpleStream.emit(2)
    reporter.stream.simpleStream.emit(3)
    reporter.stream.simpleStream.end()

    await streamPromise // Wait for the stream processing to complete

    expect(receivedItems).toEqual([1, 2, 3])
  })

  it('should handle an empty stream correctly', async () => {
    let streamEntered = false
    const streamPromise = (async () => {
      for await (const _item of receiver.stream.endStream()) {
        streamEntered = true // This should not happen
      }
    })()

    reporter.stream.endStream.end() // End immediately

    await streamPromise

    expect(streamEntered).toBe(false)
  })

  it('should propagate errors from the worker via event receiver', async () => {
    const error = new Error('Worker failed')

    const receivedPromise = receiver.event.simpleEvent()
    mockWorkerInstance?.emitError(error)

    await expect(receivedPromise).rejects.toThrow(error)
  })

  it('should propagate errors from the worker via stream receiver', async () => {
    const error = new Error('Worker failed during stream')

    const streamPromise = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _item of receiver.stream.simpleStream()) {
        // no-op
      }
    })()

    // Emit error before ending the stream
    mockWorkerInstance?.emitError(error)

    await expect(streamPromise).rejects.toThrow(error)
  })

  it('should handle messages arriving before receiver awaits', async () => {
    // Reporter sends event *before* receiver awaits it
    reporter.event.simpleEvent('early bird')

    // Give a tick for the message to be processed internally by the mock
    await new Promise((resolve) => setImmediate(resolve))

    const receivedPromise = receiver.event.simpleEvent()

    await expect(receivedPromise).resolves.toBe('early bird')
  })

  it('should handle stream emissions arriving before receiver iterates', async () => {
    // Reporter sends stream data *before* receiver starts iterating
    reporter.stream.simpleStream.emit(10)
    reporter.stream.simpleStream.emit(20)

    // Give a tick for messages to process
    await new Promise((resolve) => setImmediate(resolve))

    const receivedItems: number[] = []
    const streamPromise = (async () => {
      for await (const item of receiver.stream.simpleStream()) {
        receivedItems.push(item)
      }
    })()

    // Send remaining data and end
    reporter.stream.simpleStream.emit(30)
    reporter.stream.simpleStream.end()

    await streamPromise

    expect(receivedItems).toEqual([10, 20, 30])
  })

  it('dispose() should remove listeners and terminate worker', async () => {
    expect(mockWorkerInstance?.listenerCount('message')).toBe(1)
    expect(mockWorkerInstance?.listenerCount('error')).toBe(1)

    const terminatePromise = receiver.dispose()

    await expect(terminatePromise).resolves.toBe(0)
    expect(mockWorkerInstance?.terminate).toHaveBeenCalledTimes(1)
    expect(mockWorkerInstance?.listenerCount('message')).toBe(0)
    expect(mockWorkerInstance?.listenerCount('error')).toBe(0)
    expect(mockWorkerInstance?.terminated).toBe(true)
  })

  it('should throw error if parentPort is null for reporter', () => {
    expect(() => createReporter<TestWorkerChannel>(null)).toThrow('parentPart was falsy')
  })

  it('should ignore non-worker channel messages', async () => {
    const receivedPromise = receiver.event.simpleEvent()

    // Send a valid message
    reporter.event.simpleEvent('valid')
    await expect(receivedPromise).resolves.toBe('valid')

    const nextReceivedPromise = receiver.event.simpleEvent()

    // Send an invalid message
    mockWorkerInstance?.receiveMessage({foo: 'bar'}) // Not a valid WorkerChannelMessage
    mockWorkerInstance?.receiveMessage('just a string')
    mockWorkerInstance?.receiveMessage(null)
    mockWorkerInstance?.receiveMessage(undefined)
    mockWorkerInstance?.receiveMessage({type: 'unknown'})

    // Send the actual message we are waiting for
    reporter.event.simpleEvent('after invalid')

    // It should eventually resolve with the correct message, ignoring the invalid ones
    await expect(nextReceivedPromise).resolves.toBe('after invalid')
  })
})

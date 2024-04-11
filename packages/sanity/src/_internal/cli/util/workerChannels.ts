import {type MessagePort, type Worker} from 'node:worker_threads'

type StreamReporter<TPayload = unknown> = {emit: (payload: TPayload) => void; end: () => void}
type EventReporter<TPayload = unknown> = (payload: TPayload) => void
type EventReceiver<TPayload = unknown> = () => Promise<TPayload>
type StreamReceiver<TPayload = unknown> = () => AsyncIterable<TPayload>

type EventKeys<TWorkerChannel extends WorkerChannel> = {
  [K in keyof TWorkerChannel]: TWorkerChannel[K] extends WorkerChannelEvent<any> ? K : never
}[keyof TWorkerChannel]
type StreamKeys<TWorkerChannel extends WorkerChannel> = {
  [K in keyof TWorkerChannel]: TWorkerChannel[K] extends WorkerChannelStream<any> ? K : never
}[keyof TWorkerChannel]

type EventMessage<TPayload = unknown> = {type: 'event'; name: string; payload: TPayload}
type StreamEmissionMessage<TPayload = unknown> = {type: 'emission'; name: string; payload: TPayload}
type StreamEndMessage = {type: 'end'; name: string}
type WorkerChannelMessage = EventMessage | StreamEmissionMessage | StreamEndMessage

/**
 * Represents the definition of a "worker channel" to report progress from the
 * worker to the parent. Worker channels can define named events or streams and
 * the worker will report events and streams while the parent will await them.
 * This allows the control flow of the parent to follow the control flow of the
 * worker 1-to-1.
 */
export type WorkerChannel<
  TWorkerChannel extends Record<
    string,
    WorkerChannelEvent<unknown> | WorkerChannelStream<unknown>
  > = Record<string, WorkerChannelEvent<unknown> | WorkerChannelStream<unknown>>,
> = TWorkerChannel

export type WorkerChannelEvent<TPayload = void> = {type: 'event'; payload: TPayload}
export type WorkerChannelStream<TPayload = void> = {type: 'stream'; payload: TPayload}

export interface WorkerChannelReporter<TWorkerChannel extends WorkerChannel> {
  event: {
    [K in EventKeys<TWorkerChannel>]: TWorkerChannel[K] extends WorkerChannelEvent<infer TPayload>
      ? EventReporter<TPayload>
      : void
  }
  stream: {
    [K in StreamKeys<TWorkerChannel>]: TWorkerChannel[K] extends WorkerChannelStream<infer TPayload>
      ? StreamReporter<TPayload>
      : void
  }
}

export interface WorkerChannelReceiver<TWorkerChannel extends WorkerChannel> {
  event: {
    [K in EventKeys<TWorkerChannel>]: TWorkerChannel[K] extends WorkerChannelEvent<infer TPayload>
      ? EventReceiver<TPayload>
      : void
  }
  stream: {
    [K in StreamKeys<TWorkerChannel>]: TWorkerChannel[K] extends WorkerChannelStream<infer TPayload>
      ? StreamReceiver<TPayload>
      : void
  }
  // TODO: good candidate for [Symbol.asyncDispose] when our tooling better supports it
  dispose: () => Promise<number>
}

/**
 * A simple queue that has two primary methods: `push(message)` and
 * `await next()`. This message queue is used by the "receiver" of the worker
 * channel and this class handles buffering incoming messages if the worker is
 * producing faster than the parent as well as returning a promise if there is
 * no message yet in the queue when the parent awaits `next()`.
 */
class MessageQueue<T> {
  resolver: ((result: IteratorResult<T>) => void) | null = null
  queue: T[] = []

  push(message: T) {
    if (this.resolver) {
      this.resolver({value: message, done: false})
      this.resolver = null
    } else {
      this.queue.push(message)
    }
  }

  next(): Promise<IteratorResult<T>> {
    if (this.queue.length) {
      return Promise.resolve({value: this.queue.shift()!, done: false})
    }

    return new Promise((resolve) => (this.resolver = resolve))
  }

  end() {
    if (this.resolver) {
      this.resolver({value: undefined, done: true})
    }
  }
}

function isWorkerChannelMessage(message: unknown): message is WorkerChannelMessage {
  if (typeof message !== 'object') return false
  if (!message) return false
  if (!('type' in message)) return false
  if (typeof message.type !== 'string') return false
  const types: string[] = ['event', 'emission', 'end'] satisfies WorkerChannelMessage['type'][]
  return types.includes(message.type)
}

/**
 * Creates a "worker channel receiver" that subscribes to incoming messages
 * from the given worker and returns promises for worker channel events and
 * async iterators for worker channel streams.
 */
export function createReceiver<TWorkerChannel extends WorkerChannel>(
  worker: Worker,
): WorkerChannelReceiver<TWorkerChannel> {
  const _events = new Map<string, MessageQueue<EventMessage>>()
  const _streams = new Map<string, MessageQueue<StreamEmissionMessage>>()
  const errors = new MessageQueue<{type: 'error'; error: unknown}>()

  const eventQueue = (name: string) => {
    const queue = _events.get(name) ?? new MessageQueue()
    if (!_events.has(name)) _events.set(name, queue)
    return queue
  }

  const streamQueue = (name: string) => {
    const queue = _streams.get(name) ?? new MessageQueue()
    if (!_streams.has(name)) _streams.set(name, queue)
    return queue
  }

  const handleMessage = (message: unknown) => {
    if (!isWorkerChannelMessage(message)) return
    if (message.type === 'event') eventQueue(message.name).push(message)
    if (message.type === 'emission') streamQueue(message.name).push(message)
    if (message.type === 'end') streamQueue(message.name).end()
  }

  const handleError = (error: unknown) => {
    errors.push({type: 'error', error})
  }

  worker.addListener('message', handleMessage)
  worker.addListener('error', handleError)

  return {
    event: new Proxy({} as WorkerChannelReceiver<TWorkerChannel>['event'], {
      get: (target, name) => {
        if (typeof name !== 'string') return target[name as keyof typeof target]

        const eventReceiver: EventReceiver = async () => {
          const {value} = await Promise.race([eventQueue(name).next(), errors.next()])
          if (value.type === 'error') throw value.error
          return value.payload
        }

        return eventReceiver
      },
    }),
    stream: new Proxy({} as WorkerChannelReceiver<TWorkerChannel>['stream'], {
      get: (target, prop) => {
        if (typeof prop !== 'string') return target[prop as keyof typeof target]
        const name = prop // alias for better typescript narrowing

        async function* streamReceiver() {
          while (true) {
            const {value, done} = await Promise.race([streamQueue(name).next(), errors.next()])
            if (done) return
            if (value.type === 'error') throw value.error
            yield value.payload
          }
        }

        return streamReceiver satisfies StreamReceiver
      },
    }),
    dispose: () => {
      worker.removeListener('message', handleMessage)
      worker.removeListener('error', handleError)
      return worker.terminate()
    },
  }
}

/**
 * Creates a "worker channel reporter" that sends messages to the given
 * `parentPort` to be received by a worker channel receiver.
 */
export function createReporter<TWorkerChannel extends WorkerChannel>(
  parentPort: MessagePort | null,
): WorkerChannelReporter<TWorkerChannel> {
  if (!parentPort) {
    throw new Error('parentPart was falsy')
  }

  return {
    event: new Proxy({} as WorkerChannelReporter<TWorkerChannel>['event'], {
      get: (target, name) => {
        if (typeof name !== 'string') return target[name as keyof typeof target]

        const eventReporter: EventReporter = (payload) => {
          const message: EventMessage = {type: 'event', name, payload}
          parentPort.postMessage(message)
        }

        return eventReporter
      },
    }),
    stream: new Proxy({} as WorkerChannelReporter<TWorkerChannel>['stream'], {
      get: (target, name) => {
        if (typeof name !== 'string') return target[name as keyof typeof target]

        const streamReporter: StreamReporter = {
          emit: (payload) => {
            const message: StreamEmissionMessage = {type: 'emission', name, payload}
            parentPort.postMessage(message)
          },
          end: () => {
            const message: StreamEndMessage = {type: 'end', name}
            parentPort.postMessage(message)
          },
        }

        return streamReporter
      },
    }),
  }
}

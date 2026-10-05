import {installMessageBus, resetMessageBus} from '@sanity/sdk/_internal'
import {
  type EventTopic,
  type MessageBusClient,
  type MessageBusMessage,
  type PayloadOf,
  type ReplyOf,
  type StateTopic,
  type ValueOf,
} from '@sanity/sdk/dashboard'
import {onTestFinished} from 'vitest'

import {resetMessageBusConnection} from '../../src/core/store/messageBus/getMessageBusConnection'

const MESSAGE_BUS_KEY = Symbol.for('sanity.os.bus')

/** Event topics without a reply; answer the others with `respond`, or emitters wait for the timeout. */
type FireAndForgetTopic = {[K in EventTopic]: [ReplyOf<K>] extends [never] ? K : never}[EventTopic]

export interface MessageBusHostStub {
  /** Writes a state topic to every connection, including the ones that open later. */
  publish: <K extends StateTopic>(topic: K, value: ValueOf<K>) => void
  /** Returns a live list of the payloads emitted on a fire-and-forget event topic. */
  capture: <K extends FireAndForgetTopic>(topic: K) => PayloadOf<K>[]
  /** Answers an event topic with `message.reply(...)`. A throw here only rejects the emitter. */
  respond: <K extends EventTopic>(
    topic: K,
    handler: (message: MessageBusMessage<PayloadOf<K>, ReplyOf<K>, K>) => void,
  ) => void
}

/**
 * Installs a real message bus with a stubbed host and Studio as the connecting app, and uninstalls it
 * when the current test finishes. Call it from a test or a `beforeEach`.
 */
export function stubMessageBusHost(): MessageBusHostStub {
  Reflect.set(globalThis, '__SANITY_APP_ID__', 'studio')
  const host = installMessageBus({appId: 'host'})

  const clients = new Set<MessageBusClient>()
  const state = new Map<StateTopic, (client: MessageBusClient) => void>()
  const subscription = host.connections.subscribe((client) => {
    clients.add(client)
    client.closed.addEventListener('abort', () => clients.delete(client))
    for (const write of state.values()) write(client)
  })

  onTestFinished(() => {
    subscription.unsubscribe()
    resetMessageBusConnection()
    resetMessageBus()
    Reflect.deleteProperty(globalThis, MESSAGE_BUS_KEY)
    Reflect.deleteProperty(globalThis, '__SANITY_APP_ID__')
  })

  function respond<K extends EventTopic>(
    topic: K,
    handler: (message: MessageBusMessage<PayloadOf<K>, ReplyOf<K>, K>) => void,
  ) {
    host.subscribe(topic, handler)
  }

  function capture<K extends FireAndForgetTopic>(topic: K) {
    const payloads: PayloadOf<K>[] = []
    respond(topic, (message) => {
      payloads.push(message.payload)
    })
    return payloads
  }

  function publish<K extends StateTopic>(topic: K, value: ValueOf<K>) {
    const write = (client: MessageBusClient) => client.emit(topic, value)
    state.set(topic, write)
    clients.forEach(write)
  }

  return {publish, capture, respond}
}

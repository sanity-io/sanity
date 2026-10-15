import {connectMessageBus, type MessageBusConnection} from '@sanity/sdk/dashboard'

// Cached, because every `connectMessageBus()` call registers another connection with the host.
let connection: MessageBusConnection | undefined

/** @internal */
export function getMessageBusConnection(): MessageBusConnection | undefined {
  connection ??= connectMessageBus()
  return connection
}

/**
 * For tests: the next `getMessageBusConnection()` connects to the bus installed by then.
 *
 * @internal
 */
export function resetMessageBusConnection(): void {
  connection?.disconnect()
  connection = undefined
}

import {connectMessageBus, type MessageBusConnection} from '@sanity/sdk/dashboard'

// Cached, because every `connectMessageBus()` call registers another connection with the host.
let connection: MessageBusConnection | undefined
let appId: string | undefined

/**
 * The app ID to connect with when the app's build didn't inline `__SANITY_APP_ID__`, e.g. `sanity` loaded from the module CDN.
 *
 * @internal
 */
export function setMessageBusAppId(id: string | undefined): void {
  appId = id
}

/** @internal */
export function getMessageBusConnection(): MessageBusConnection | undefined {
  connection ??= connectMessageBus(appId ? {appId} : undefined)
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
  appId = undefined
}

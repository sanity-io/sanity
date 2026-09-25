import {connectMessageBus, type MessageBusConnection} from '@sanity/sdk/dashboard'

// The Studio's connection to the workbench message bus, or `undefined` when
// the Studio is not running as a federated remote inside the workbench (the
// host installs the bus before it loads remotes, so a standalone Studio never
// gets one; a retry on `undefined` is therefore harmless). The bus writes
// state per connection, so the Studio needs one of its own to read anything,
// and one only: every `connectMessageBus()` call registers a new connection
// with the host. The app id comes from `__SANITY_APP_ID__`, which the CLI
// inlines for any studio declared with `defineApplication` — a requirement
// for being federated. Note: this is a different embedding model to the Core
// UI iframe (`_context=…&mode=core-ui`), which is detected separately via the
// rendering context — that signal is not set on the federation path.
let connection: MessageBusConnection | undefined

/** @internal */
export function getMessageBusConnection(): MessageBusConnection | undefined {
  connection ??= connectMessageBus()
  return connection
}

/**
 * Disconnects and forgets the cached connection, so the next `getMessageBusConnection()` connects to
 * the currently installed bus. For tests that install and tear down a bus.
 *
 * @internal
 */
export function resetMessageBusConnection(): void {
  connection?.disconnect()
  connection = undefined
}

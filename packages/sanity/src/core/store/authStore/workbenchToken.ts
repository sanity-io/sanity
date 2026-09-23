import {connectMessageBus, type MessageBusConnection} from '@sanity/sdk/dashboard'
import {type Observable, of} from 'rxjs'
import {catchError} from 'rxjs/operators'

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
function getConnection(): MessageBusConnection | undefined {
  connection ??= connectMessageBus()
  return connection
}

/**
 * Observes the session token issued by the workbench "OS", tracking the OS auth
 * state over time.
 *
 * Returns `undefined` when the Studio is not embedded in the workbench, so the
 * caller uses its normal auth flow. Inside the workbench, subscribes to the
 * `auth.token` state topic, emitting the current token — or `null` when the OS
 * is signed out — and re-emitting as the OS auth state changes, so sign-in/out
 * propagates instead of being captured once. Any bus error is treated as "no
 * token" (`null`). The token is used in-memory only and never persisted.
 *
 * @internal
 */
export function observeWorkbenchToken(): Observable<string | null> | undefined {
  return getConnection()
    ?.subscribe('auth.token')
    .pipe(catchError(() => of(null)))
}

/**
 * Asks the workbench "OS" to reissue the session token, e.g. after its current
 * one was rejected with a 401. Fire-and-forget: the reissued token arrives via
 * the `auth.token` subscription in {@link observeWorkbenchToken}. No-op outside
 * the workbench, and a failed request (e.g. the OS is signed out, so nothing
 * responds) is dropped.
 *
 * @internal
 */
export function refreshWorkbenchToken(): void {
  getConnection()
    ?.emit('auth.token.refresh')
    .catch(() => {})
}

import {from, type Observable, of} from 'rxjs'
import {catchError, switchMap} from 'rxjs/operators'

// The workbench host installs its shared message bus on this well-known global
// symbol before it loads federated remotes. It must match the key used by
// `@sanity/workbench` (`Symbol.for('sanity.os.bus')`).
const OS_BUS_KEY = Symbol.for('sanity.os.bus')

/**
 * Whether this Studio is running as a federated remote inside the workbench.
 *
 * Federation shares the host's realm, so the installed bus is visible on
 * `globalThis`. This is `false` in a standalone Studio, where we must never
 * import `@sanity/workbench` (it would install a bus and add bundle weight for
 * no reason). Note: this is a different embedding model to the Core UI iframe
 * (`_context=…&mode=core-ui`), which is detected separately via the rendering
 * context — that signal is not set on the federation path.
 */
function isWorkbenchEnvironment(): boolean {
  return typeof globalThis === 'object' && OS_BUS_KEY in globalThis
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
  if (!isWorkbenchEnvironment()) return undefined

  return from(import('@sanity/workbench')).pipe(
    switchMap(({os}) => os.subscribe('auth.token')),
    // Any failure (importing the host bundle, or the subscription) means "no OS token".
    catchError(() => of(null)),
  )
}

/**
 * Asks the workbench "OS" to reissue the session token, e.g. after its current
 * one was rejected with a 401. Fire-and-forget: the reissued token arrives via
 * the `auth.token` subscription in {@link observeWorkbenchToken}. No-op outside
 * the workbench.
 *
 * @internal
 */
export function refreshWorkbenchToken(): void {
  if (!isWorkbenchEnvironment()) return

  void import('@sanity/workbench').then(
    ({os}) => os.emit('auth.token.refresh', undefined),
    () => {},
  )
}

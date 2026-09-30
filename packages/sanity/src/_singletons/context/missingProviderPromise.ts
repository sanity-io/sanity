import type {ObservablePromise} from 'react-rx'

/**
 * The default value for a context that carries a promise for `use()`: an already rejected
 * promise, so `use(use(SomePromiseContext))` outside the provider throws a `TypeError` naming the
 * missing provider synchronously, the way `useWorkspace()` and friends fail outside theirs.
 * It carries React's rejected-thenable fields (`status`, `reason`) so `use()` never suspends on
 * it, and the rejection is marked handled so the module-level default is not reported as an
 * unhandled rejection.
 *
 * @internal
 */
export function missingProviderPromise<T>(
  contextName: string,
  providerName: string,
): ObservablePromise<T> {
  const reason = new TypeError(
    `Tried to read ${contextName} but no parent ${providerName} provides it. It is provided through \`studio.components.provider\`, above the studio's loading screen.`,
  )
  const promise = Promise.reject<T>(reason)
  promise.catch(() => undefined)
  return Object.assign(promise, {status: 'rejected' as const, reason})
}

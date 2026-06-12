import {useContext} from 'react'
import {StudioErrorHandlerContext} from 'sanity/_singletons'

import {type StudioErrorHandler} from './types'

/**
 * Access the studio's request-error reporter — the call-site API for
 * delegating unrecoverable request errors (network failures, 5xx, 429)
 * to the studio's built-in error UI.
 *
 * The studio never intercepts requests on its own: plugins and
 * customizations handle their own errors by default (inline errors,
 * toasts, fallbacks). Use this reporter for the failures your code
 * cannot recover from locally.
 *
 * @example
 * ```tsx
 * function MyPluginComponent() {
 *   const client = useClient({apiVersion: '2025-02-19'})
 *   const {attempt, handle} = useStudioErrorHandler()
 *
 *   const loadSettings = useCallback(async () => {
 *     // Retryable read: "Try again" in the studio dialog re-runs the thunk.
 *     const settings = await attempt(
 *       () => client.fetch('*[_id == "myPlugin.settings"][0]'),
 *       {retryable: true},
 *     )
 *     return settings
 *   }, [client, attempt])
 *
 *   const save = useCallback(
 *     (doc: SanityDocument) =>
 *       client
 *         .createOrReplace(doc)
 *         // Fire-and-surface: a network/5xx failure shows the studio
 *         // dialog (reload-only, conservative copy). Caller-domain errors
 *         // (validation, permissions) are re-thrown to the next .catch.
 *         .catch(handle)
 *         .catch(showInlineValidationError),
 *     [client, handle],
 *   )
 *   // ...
 * }
 * ```
 *
 * @beta
 */
export function useStudioErrorHandler(): StudioErrorHandler {
  const reporter = useContext(StudioErrorHandlerContext)
  if (!reporter) {
    throw new Error('useStudioErrorHandler() must be used inside a Studio (WorkspacesProvider)')
  }
  return reporter
}

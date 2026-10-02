import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'

import {isNetworkError, isUnauthorizedError} from '../../../studio/requestErrors/classify'
import {type RequestFailureDiagnostics} from '../../../studio/requestErrors/diagnoseRequestFailure'
import {type StudioErrorHandler} from '../../../studio/requestErrors/types'

/**
 * `client` without the studio request handler, for auth checks that must see their own 401s.
 * Guarded for custom `unstable_clientFactory` clients that may not implement `withConfig`; those
 * don't carry the handler anyway.
 *
 * @internal
 */
export function withoutRequestHandler(client: SanityClient): SanityClient {
  return typeof client.withConfig === 'function'
    ? client.withConfig({requestHandler: undefined})
    : client
}

/**
 * Fetches the current user for `client`, resolving `undefined` when the credentials are rejected.
 *
 * @internal
 */
export const getCurrentUser = async (
  client: SanityClient,
  tag: string,
  getRequestErrorHandler?: () => StudioErrorHandler | undefined,
  diagnostics?: RequestFailureDiagnostics,
): Promise<CurrentUser | undefined> => {
  // Probe with the forced-logout middleware stripped off. That middleware
  // (installed on every studio client) parks 401s forever to drive forced
  // logout — but this probe IS the auth-state source of truth and handles its
  // own 401 below. If the middleware parked this request, `fetchUser` would
  // never settle, so the auth state could never transition to logged-out and
  // the studio would freeze instead of showing the login screen. The 401 must
  // reach the `.catch` here, not the channel.
  //
  // Guarded for custom `unstable_clientFactory` clients that may not implement
  // `withConfig` — those don't carry the middleware anyway.
  const probeClient = withoutRequestHandler(client)
  const fetchUser = () =>
    probeClient
      .request({
        url: '/users/me',
        tag: `users.get-current${tag ? `.${tag}` : ''}`,
      })
      .catch(async (err) => {
        // 401 means the user had some kind of credentials but failed to
        // authenticate — treat it as logged out. Resolved inside the thunk
        // so the request-error channel never sees the 401: at boot this is
        // the normal logged-out state (AuthBoundary shows the login
        // screen), not a session-expiry event to verify and tear down.
        if (isUnauthorizedError(err)) return undefined

        // This probe runs on a client with the studio request handler stripped
        // (so its 401 reaches the branch above), which means it bypasses the
        // handler's CORS / missing-project-or-dataset detection. Diagnose those
        // here instead: when the studio can't reach the project because the
        // origin isn't allowed (CORS — which can change at any time) or the
        // project/dataset doesn't exist, report it so the studio takes over the
        // screen, and resolve as logged-out rather than surfacing a generic
        // network error.
        if (diagnostics) {
          const result = await diagnostics.diagnose(err, probeClient)
          if (result.type !== 'unknown') {
            // `attempt` (below) may re-run this thunk on a recurring failure, so
            // this can fire more than once — `onRequestFailure` is idempotent.
            diagnostics.onRequestFailure(result, probeClient)
            return undefined
          }
        }
        throw err
      })

  try {
    // Network errors / 5xx on this boot-critical read leave the studio
    // unable to start — there is no local recovery. Delegate them to the
    // studio's request-error dialog (retryable: it's an idempotent GET)
    // instead of crashing the boot sequence. Resolved lazily: the channel
    // may not exist yet when the store is constructed.
    const requestErrorChannel = getRequestErrorHandler?.()
    const user = requestErrorChannel
      ? await requestErrorChannel.attempt(fetchUser, {retryable: true})
      : await fetchUser()

    // if the user came back with an id, assume it's a full CurrentUser
    return typeof user?.id === 'string' ? user : undefined
  } catch (err) {
    // Reached only in the no-channel fallback path, or for errors the
    // channel declined to claim. Guarded: a thrown value can be anything,
    // so don't touch properties until it's confirmed to be a network error.
    if (isNetworkError(err) && !err.message) {
      const url = (err as Error & {request?: {url?: string}}).request?.url
      if (url) {
        throw new Error(`Unknown network error attempting to reach ${new URL(url).host}`, {
          cause: err,
        })
      }
    }

    // Some other error, just throw it
    throw err
  }
}

import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'

import {createAuthStore, type RequestFailureDiagnostics} from '../store/authStore/createAuthStore'
import {type AuthStore} from '../store/authStore/types'
import {isAuthStore} from '../store/authStore/utils/asserters'
import {mapAuthStoreClients} from '../store/authStore/utils/mapAuthStoreClients'
import {withRequestHandler} from '../store/authStore/utils/requestHandler'
import {
  type RequestErrorChannel,
  type StudioRequestHandlerFactory,
} from '../studio/requestErrors/types'
import {type SourceOptions} from './types'

/**
 * Studio wiring handed to the auth store of each source.
 *
 * `createStudioRequestHandler` applies to every source. The other two only
 * reach a store built here from an `AuthConfig`; a pre-built `AuthStore` has
 * no seam left to receive them, so its own `/users/me` probe runs without
 * the channel and the failure diagnostics.
 *
 * @internal
 */
export interface GetAuthStoreOptions {
  createStudioRequestHandler?: StudioRequestHandlerFactory
  requestErrorChannel?: RequestErrorChannel
  requestFailureDiagnostics?: RequestFailureDiagnostics
}

/**
 * Resolves the `AuthStore` for a source, with the studio request handler on
 * the clients it emits.
 *
 * @internal
 */
export function getAuthStore(
  source: SourceOptions,
  {createStudioRequestHandler, requestErrorChannel, requestFailureDiagnostics}: GetAuthStoreOptions,
): AuthStore {
  if (isAuthStore(source.auth)) {
    // A pre-built store has already constructed its clients, so the handler is
    // attached at the store boundary rather than through the client factory —
    // `RequestAccessScreen`, `registerLiveStudioManifest` and the CORS recheck
    // read `auth.state`'s client directly, so wrapping `source$` would miss them.
    return createStudioRequestHandler
      ? withStudioRequestHandler(source.auth, createStudioRequestHandler)
      : source.auth
  }

  const clientFactory = source.unstable_clientFactory ?? createClient

  const {projectId, dataset, apiHost} = source
  return createAuthStore({
    apiHost,
    ...source.auth,
    clientFactory: (config) => {
      let client: SanityClient
      client = clientFactory({
        ...config,
        ...(createStudioRequestHandler
          ? {requestHandler: createStudioRequestHandler(() => client)}
          : {}),
      })
      return client
    },
    // Passed as getters so this unhashable runtime wiring stays out of the
    // auth-store memo key.
    getRequestErrorHandler: () => requestErrorChannel,
    getRequestFailureDiagnostics: () => requestFailureDiagnostics,
    dataset,
    projectId,
  })
}

// One wrapper per store, for the life of the page: `AuthBoundary` keys its
// one-shot `handleCallbackUrl()` on the auth store's identity, and
// `prepareConfig` re-runs per render for single-workspace configs.
const studioHandledAuthStores = new WeakMap<AuthStore, AuthStore>()

/**
 * Only applied when the store has `logout`: a claimed invalid-session 401
 * parks the request until the studio logs out, and a store that can't would
 * leave it pending with no dialog. Skipping the handler also drops CORS /
 * project-not-found / dataset-not-found detection and request-performance
 * tracking for the store's clients (see `createStudioRequestHandler`).
 *
 * A `requestHandler` the store configured itself keeps running, inside the
 * studio's.
 */
function withStudioRequestHandler(
  auth: AuthStore,
  createStudioRequestHandler: StudioRequestHandlerFactory,
): AuthStore {
  if (typeof auth.logout !== 'function') return auth

  let wrapped = studioHandledAuthStores.get(auth)
  if (!wrapped) {
    wrapped = mapAuthStoreClients(auth, (source) => {
      const ownHandler = source.config().requestHandler
      let client: SanityClient
      const studioHandler = createStudioRequestHandler(() => client)
      const requestHandler: RequestHandler = ownHandler
        ? (request, next) => studioHandler(request, (req) => ownHandler(req, next))
        : studioHandler
      client = withRequestHandler(source, requestHandler)
      return client
    })
    studioHandledAuthStores.set(auth, wrapped)
  }
  return wrapped
}

import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'
import {map} from 'rxjs/operators'

import {createAuthStore, type RequestFailureDiagnostics} from '../store/authStore/createAuthStore'
import {type AuthStore} from '../store/authStore/types'
import {isAuthStore} from '../store/authStore/utils/asserters'
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
    // attached at the store boundary. The `AuthConfig` branch installs it via
    // the client factory instead, which also covers the clients
    // `createAuthStore` builds for its own probe / exchange / logout traffic —
    // coverage a store-boundary decorator can't reach, and the reason the two
    // branches are not unified on `withStudioRequestHandler`.
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

// One wrapped store per pre-built store. This is not just a cache:
// `prepareConfig` re-runs per render for single-workspace configs, and
// `AuthBoundary` keys its one-shot `handleCallbackUrl()` on the auth store's
// identity — a wrapper rebuilt per render would re-run the credential
// exchange every render and never settle the callback gate.
//
// Keyed on the store alone, so the first handler factory a studio session
// sees is the one the wrapper keeps. That matches the `AuthConfig` branch
// (whose store is memoized on its options) and `prepareConfig`'s own
// per-workspace cache: a remounted `WorkspacesProvider` keeps routing through
// the channel of the first mount on every path.
const studioHandledAuthStores = new WeakMap<AuthStore, AuthStore>()

// Every member of `AuthStore` is mandatory in this literal (while keeping the
// optional ones' `| undefined`), so a member added to the interface fails to
// compile here instead of being silently dropped by the wrapper. Do not
// "simplify" back to `: AuthStore` — only `state` is required on it.
type ExhaustiveAuthStore = {[K in keyof Required<AuthStore>]: AuthStore[K]}

/**
 * Attaches the studio request handler to the clients emitted by a pre-built
 * `AuthStore`. A store built ahead of time (`auth: createAuthStore({...})`)
 * has already constructed its clients, so the handler cannot be injected
 * through the client factory the way `getAuthStore` does for an `AuthConfig`.
 *
 * Only applied when the store has `logout`: a claimed invalid-session 401
 * parks the request until the studio logs out, and a store that can't would
 * leave it pending with no dialog. The gate is wider than that one path —
 * skipping the handler also drops CORS / project-not-found /
 * dataset-not-found detection and request-performance tracking for the
 * store's clients (see `createStudioRequestHandler`).
 *
 * A `requestHandler` the store configured itself keeps running, inside the
 * studio's.
 */
function withStudioRequestHandler(
  auth: AuthStore,
  createStudioRequestHandler: StudioRequestHandlerFactory,
): AuthStore {
  if (typeof auth.logout !== 'function') return auth

  const cached = studioHandledAuthStores.get(auth)
  if (cached) return cached

  // `map` runs once per subscriber, so the wrapped client is cached per
  // emitted client: every subscriber sees the same instance for the same
  // upstream emission, as they would with an unwrapped store.
  const wrappedClients = new WeakMap<SanityClient, SanityClient>()
  const wrapClient = (source: SanityClient): SanityClient => {
    const existing = wrappedClients.get(source)
    if (existing) return existing
    const ownHandler = source.config().requestHandler
    let client: SanityClient
    const studioHandler = createStudioRequestHandler(() => client)
    const requestHandler: RequestHandler = ownHandler
      ? (request, next) => studioHandler(request, (req) => ownHandler(req, next))
      : studioHandler
    client = withRequestHandler(source, requestHandler)
    wrappedClients.set(source, client)
    return client
  }

  // Members are delegated explicitly rather than spread: `AuthStore` is a
  // duck-typed interface, so a class-based store keeps its methods on the
  // prototype (which a spread drops) and reads `this` inside them.
  const wrapped: ExhaustiveAuthStore = {
    state: auth.state.pipe(
      map((state) => {
        const client = wrapClient(state.client)
        return client === state.client ? state : {...state, client}
      }),
    ),
    token: auth.token,
    LoginComponent: auth.LoginComponent,
    logout: auth.logout.bind(auth),
    handleCallbackUrl: auth.handleCallbackUrl?.bind(auth),
  }
  studioHandledAuthStores.set(auth, wrapped)
  return wrapped
}

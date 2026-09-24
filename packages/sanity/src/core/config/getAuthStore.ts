import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'
import {map} from 'rxjs/operators'

import {createAuthStore, type RequestFailureDiagnostics} from '../store/authStore/createAuthStore'
import {type AuthStore} from '../store/authStore/types'
import {isAuthStore} from '../store/authStore/utils/asserters'
import {
  type RequestErrorChannel,
  type StudioRequestHandlerFactory,
} from '../studio/requestErrors/types'
import {type SourceOptions} from './types'

/** @internal */
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
    // The two branches attach the handler differently. A pre-built store has
    // already constructed its clients, so it is decorated at the store
    // boundary and cached per (store, factory) — a remounted
    // `WorkspacesProvider` with a new channel gets a fresh wrapper. The
    // `AuthConfig` branch below bakes the factory into the client factory
    // closure of a store memoized on its options, so the first factory a
    // studio session sees is the one that store keeps. Unifying both on
    // `withStudioRequestHandler` is a follow-up: it changes what an
    // `unstable_clientFactory` receives in its config.
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

// One wrapped store per (store, handler factory) pair, so every source that
// shares a pre-built store — and every `prepareConfig` call within a studio
// session — resolves to the same wrapped instance and the same client per
// emission, keeping downstream identity-based caches stable.
const studioHandledAuthStores = new WeakMap<
  AuthStore,
  WeakMap<StudioRequestHandlerFactory, AuthStore>
>()

/**
 * Attaches the studio request handler to the clients emitted by a pre-built
 * `AuthStore`. A store built ahead of time (`auth: createAuthStore({...})`)
 * has already constructed its clients, so the handler cannot be injected
 * through the client factory the way `getAuthStore` does for an `AuthConfig`.
 *
 * Only applied when the store has `logout`: a claimed 401 parks the request
 * until the studio logs out, and a store that can't would leave it pending.
 * A `requestHandler` the store configured itself keeps running, inside the
 * studio's.
 *
 * @internal
 */
export function withStudioRequestHandler(
  auth: AuthStore,
  createStudioRequestHandler: StudioRequestHandlerFactory,
): AuthStore {
  if (typeof auth.logout !== 'function') return auth

  let byFactory = studioHandledAuthStores.get(auth)
  if (!byFactory) {
    byFactory = new WeakMap()
    studioHandledAuthStores.set(auth, byFactory)
  }
  const cached = byFactory.get(createStudioRequestHandler)
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
    client = source.withConfig({requestHandler})
    wrappedClients.set(source, client)
    return client
  }

  // Members are delegated explicitly rather than spread: `AuthStore` is a
  // duck-typed interface, so a class-based store keeps its methods on the
  // prototype (which a spread drops) and reads `this` inside them.
  const wrapped: AuthStore = {
    state: auth.state.pipe(
      map((state) => {
        // Custom `unstable_clientFactory` clients may not implement
        // `withConfig`; those cannot be given a handler after the fact.
        if (typeof state.client.withConfig !== 'function') return state
        return {...state, client: wrapClient(state.client)}
      }),
    ),
    token: auth.token,
    LoginComponent: auth.LoginComponent,
    logout: auth.logout.bind(auth),
    handleCallbackUrl: auth.handleCallbackUrl?.bind(auth),
  }
  byFactory.set(createStudioRequestHandler, wrapped)
  return wrapped
}

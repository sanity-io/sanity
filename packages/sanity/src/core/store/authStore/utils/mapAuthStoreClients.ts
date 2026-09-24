import {type SanityClient} from '@sanity/client'
import {map} from 'rxjs/operators'

import {type AuthStore} from '../types'

// All members required (optional ones keeping `| undefined`), so a member
// added to `AuthStore` fails to compile here instead of being dropped from
// every derived store.
type ExhaustiveAuthStore = {[K in keyof Required<AuthStore>]: AuthStore[K]}

/**
 * Derives an `AuthStore` whose `state` emits `mapClient`-transformed clients.
 *
 * `mapClient` runs once per upstream client, so every subscriber sees the same
 * client instance for the same upstream emission — as they would with `auth`.
 * A state whose client maps to itself is passed through unchanged.
 *
 * `AuthStore` is duck-typed, so `auth` may be a class instance whose methods
 * live on the prototype and read `this`. Members are delegated explicitly and
 * methods bound to `auth`; an object spread would drop them.
 *
 * @internal
 */
export function mapAuthStoreClients(
  auth: AuthStore,
  mapClient: (client: SanityClient) => SanityClient,
): AuthStore {
  const mapped = new WeakMap<SanityClient, SanityClient>()
  const mapOnce = (client: SanityClient): SanityClient => {
    let existing = mapped.get(client)
    if (!existing) {
      existing = mapClient(client)
      mapped.set(client, existing)
    }
    return existing
  }

  const derived: ExhaustiveAuthStore = {
    state: auth.state.pipe(
      map((state) => {
        const client = mapOnce(state.client)
        return client === state.client ? state : {...state, client}
      }),
    ),
    token: auth.token,
    LoginComponent: auth.LoginComponent,
    logout: auth.logout?.bind(auth),
    handleCallbackUrl: auth.handleCallbackUrl?.bind(auth),
  }
  return derived
}

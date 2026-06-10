import {createClient} from '@sanity/client'
import {from, of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'

/**
 * A self-contained auth store for the fully-local `local-content-lake` workspace.
 *
 * The local backend mesh has no auth service: the studio's normal login bootstrap
 * (`/auth/providers`, `/auth/id`, the `#token` hash → localStorage dance) cannot complete against
 * it. A workspace `auth` field accepts a pre-built auth store (duck-typed: any object exposing a
 * `state` observable), which `getAuthStore` uses verbatim and so skips that whole flow. We hand the
 * studio a store that is already authenticated with a token-bearing client, so `pnpm dev` opens
 * straight into the workspace with no browser steps.
 */
const FALLBACK_USER = {
  id: 'local-dev',
  name: 'Local Dev',
  email: 'local-dev@sanity.io',
  role: 'administrator',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

export function createLocalContentLakeAuthStore(options: {
  token: string
  projectId: string
  dataset: string
  apiHost: string
}) {
  const {token, projectId, dataset, apiHost} = options

  const client = createClient({
    projectId,
    dataset,
    apiHost,
    apiVersion: '2025-02-19',
    token,
    useCdn: false,
    withCredentials: false,
    ignoreBrowserTokenWarning: true,
  })

  // Resolve the real user from the local backend when reachable, but emit an authenticated state
  // immediately (and on any failure) so the studio never hangs on a login/loading screen.
  const authenticatedWithFallback = {
    authenticated: true as const,
    client,
    currentUser: FALLBACK_USER,
  }
  const state = from(client.request({uri: '/users/me', tag: 'local-content-lake.users-me'})).pipe(
    map((currentUser) => ({
      authenticated: true as const,
      client,
      currentUser: currentUser && typeof currentUser.id === 'string' ? currentUser : FALLBACK_USER,
    })),
    catchError(() => of(authenticatedWithFallback)),
    startWith(authenticatedWithFallback),
  )

  return {state, token: of(token)}
}

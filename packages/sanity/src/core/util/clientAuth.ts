import {type InitializedClientConfig, type ResolvedAuth, type SanityClient} from '@sanity/client'
import {from, type Observable, of} from 'rxjs'
import {catchError, map, switchMap} from 'rxjs/operators'

const ANONYMOUS: ResolvedAuth = {}

/**
 * The credential a client sends, as `client.getAuth()` resolves it, kept current as it changes:
 * `{token}`, `{withCredentials: true}` or `{}` for anonymous. Under a reactive `auth` this
 * follows every rotation, where `client.config().token` is the token last resolved by a request
 * and may be unset or stale. Once the credential source errors (the session ended) it reads as
 * anonymous.
 *
 * Also returns the value known before the stream has emitted: the credential itself for a static
 * one, `undefined` for a reactive one.
 *
 * For code that hands the credential to something outside the client: a plain `fetch`, an
 * iframe, an `EventSource`, a URL. Anything that can go through the client should.
 *
 * @internal
 */
export function clientAuth(
  client: SanityClient,
): [auth$: Observable<ResolvedAuth>, initial: ResolvedAuth | undefined] {
  const config = client.config()
  // A reactive `auth` is an enumerable key of `config()`; the observable the client derives from
  // the static `token` / `withCredentials` options is not, and for those the static read is
  // exact and synchronous. A client without `auth` at all (an older client, a test double) is
  // static too.
  const reactive = Object.prototype.propertyIsEnumerable.call(config, 'auth')
  if (!reactive || !config.auth) {
    const value = staticAuth(config)
    return [of(value), value]
  }
  const auth$ = config.auth.pipe(
    switchMap((pending) => from(pending)),
    map((state): ResolvedAuth => state ?? ANONYMOUS),
    catchError(() => of(ANONYMOUS)),
  )
  return [auth$, undefined]
}

function staticAuth(config: InitializedClientConfig): ResolvedAuth {
  // oxlint-disable-next-line no-deprecated -- a static credential, where the read is exact
  const {token, withCredentials} = config
  if (token) return {token}
  if (withCredentials) return {withCredentials: true}
  return ANONYMOUS
}

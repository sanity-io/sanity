import {type InitializedClientConfig, type ResolvedAuth, type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {catchError} from 'rxjs/operators'

const ANONYMOUS: ResolvedAuth = {}

/**
 * The credential a client sends, kept current as it changes: `client.observeAuth()`, which emits
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
  const auth$ = client.observeAuth().pipe(catchError(() => of(ANONYMOUS)))
  // A static credential is known before the stream emits, so a component can render with it at
  // once. Only a client with a reactive credential has `auth` in its config.
  const config = client.config()
  return [auth$, config.auth ? undefined : staticAuth(config)]
}

function staticAuth(config: InitializedClientConfig): ResolvedAuth {
  const {token, withCredentials} = config
  if (token) return {token}
  if (withCredentials) return {withCredentials: true}
  return ANONYMOUS
}

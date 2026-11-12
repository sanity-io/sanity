import {type ResolvedAuth, type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {clientAuth} from '../util/clientAuth'

/**
 * The credential a client sends right now, as `client.getAuth()` resolves it, kept current as it
 * changes: `{token}`, `{withCredentials: true}` or `{}` for anonymous, and `undefined` while a
 * reactive credential has not settled yet. See {@link clientAuth}. A static credential is known
 * on the first render.
 *
 * For components that have to hand the credential to something outside the client: a plain
 * `fetch`, an iframe, a URL. Anything that can go through the client should.
 *
 * @internal
 */
export function useClientAuth(client: SanityClient): ResolvedAuth | undefined {
  const [auth$, initial] = useMemo(() => clientAuth(client), [client])
  return useObservable(auth$, initial)
}

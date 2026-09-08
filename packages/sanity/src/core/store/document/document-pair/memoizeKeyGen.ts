import {type SanityClient} from '@sanity/client'

import {type IdPair} from '../types'

// Pair streams are memoized for the life of the page, so the key has to
// change when the credentials do: after a re-auth the auth store hands out a
// new client with a new token, and a pair built on the old one would keep
// listening (and failing) with the stale token while every other store has
// moved on. Clients carrying the same token still share a pair — the studio
// builds several (different api versions) per source. Cookie clients (no
// token) all share: the cookie is browser-global, so a reconnect picks up the
// current session on its own. Mapped to a counter so the key never contains
// the token; the map only ever holds one entry per token seen on this page.
const credentialIds = new Map<string, number>()

function getCredentialId(client: SanityClient): number {
  const token = client.config().token ?? ''
  let id = credentialIds.get(token)
  if (id === undefined) {
    id = credentialIds.size
    credentialIds.set(token, id)
  }
  return id
}

export function memoizeKeyGen(client: SanityClient, idPair: IdPair, typeName: string) {
  const config = client.config()
  return `${getCredentialId(client)}-${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${idPair.versionId ?? ''}-${typeName}`
}

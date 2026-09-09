import {type SanityClient} from '@sanity/client'

import {type IdPair} from '../types'

// The key must include the token: the pair captures its client and keeps a
// listener open, so keying by project/dataset alone would replay a stale-token
// pair after a re-login and 401 on `/data/listen`. Key by token
// value, not client instance — sibling clients sharing a token reuse one pair,
// and only a real credential change makes a new one (instance-keying churns on
// every re-render). Token stays in memory (never logged).
export function memoizeKeyGen(client: SanityClient, idPair: IdPair, typeName: string) {
  const config = client.config()
  return `${config.token ?? ''}-${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${idPair.versionId ?? ''}-${typeName}`
}

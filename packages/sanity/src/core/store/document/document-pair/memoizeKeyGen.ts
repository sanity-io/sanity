import {type SanityClient} from '@sanity/client'

import {type IdPair} from '../types'
import {createMemoKey, getClientCredentialSegments} from '../utils/memoKey'

// The key must include the credential: the pair captures its client and keeps a
// listener open, so keying by project/dataset alone would replay a stale-token
// pair after a re-login and 401 on `/data/listen`. See getClientCredentialSegments.
export function memoizeKeyGen(client: SanityClient, idPair: IdPair, typeName: string) {
  return createMemoKey([
    ...getClientCredentialSegments(client),
    idPair.publishedId,
    idPair.versionId,
    typeName,
  ])
}

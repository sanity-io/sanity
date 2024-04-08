import {type SanityClient} from '@sanity/client'

import {type IdPair} from '../types'

export function memoizeKeyGen(
  client: SanityClient,
  idPair: IdPair,
  typeName: string,
  serverActionsEnabled?: boolean,
) {
  const config = client.config()
  return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${typeName}${serverActionsEnabled ? '-serverActionsEnabled' : ''}`
}

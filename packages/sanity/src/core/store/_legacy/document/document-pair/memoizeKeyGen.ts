import {type IdPair} from '../types'
import {type SanityClient} from '@sanity/client'

export function memoizeKeyGen(client: SanityClient, idPair: IdPair, typeName: string) {
  const config = client.config()
  return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${idPair.versionId ?? ''}-${typeName}`
}

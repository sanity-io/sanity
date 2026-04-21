import {type SanityClient} from '@sanity/client'

export function getOperationStoreKey(client: SanityClient): string {
  const config = client.config()
  return `${config.projectId ?? ''}-${config.dataset ?? ''}`
}

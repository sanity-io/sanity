import {type SanityClient} from '@sanity/client'

export function getOperationStoreKey(client: SanityClient): string {
  const config = client.config()
  const {projectId, dataset} = config
  if (!projectId) {
    throw new Error('Client is missing projectId')
  }
  if (!dataset) {
    throw new Error('Client is missing dataset')
  }
  return `${projectId}-${dataset}`
}

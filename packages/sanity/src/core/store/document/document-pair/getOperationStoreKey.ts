import {type SanityClient} from '@sanity/client'

export function getOperationStoreKey(client: SanityClient): string {
  const config = client.config()
  const {projectId, dataset, token} = config
  if (!projectId) {
    throw new Error('Client is missing projectId')
  }
  if (!dataset) {
    throw new Error('Client is missing dataset')
  }
  // Include the token so an operation is routed to the pipeline built on the
  // same credential. This key only needs to agree between the emitter and the
  // pipeline (both call this function) — it does not have to equal the
  // operationEvents memo key. Once operationEvents is memoized per token, a
  // re-login runs a second pipeline; without the token here one emitted
  // operation would match both the fresh and the stale-token pipeline while
  // both are briefly subscribed and execute the mutation twice.
  return `${projectId}-${dataset}-${token ?? ''}`
}

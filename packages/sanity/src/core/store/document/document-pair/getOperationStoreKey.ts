import {type SanityClient} from '@sanity/client'

import {createMemoKey, getClientCredentialSegments} from '../utils/memoKey'

/**
 * Routes an emitted operation to the `operationEvents` pipeline built on the same credential.
 * The pipeline computes it once; each `OperationsAPI` computes it when it is created, and an
 * operation whose key matches no live pipeline is dropped. So the two must agree for as long as
 * the credential source lives, and differ across a re-login: without that, one emitted operation
 * would match both the fresh and the stale pipeline while both are briefly subscribed and run
 * the mutation twice.
 *
 * It is built from the credential *source* ({@link getClientCredentialSegments}), never from
 * `config().token`: under a reactive `auth` that is the token the client last resolved, which
 * changes at every rotation, and an `OperationsAPI` created after a rotation (a document pane
 * reopened after one) would key differently from the pipeline and every edit would be silently
 * dropped, with the form still editable.
 */
export function getOperationStoreKey(client: SanityClient): string {
  const [credential, dataset, projectId] = getClientCredentialSegments(client)
  if (!projectId) {
    throw new Error('Client is missing projectId')
  }
  if (!dataset) {
    throw new Error('Client is missing dataset')
  }
  return createMemoKey([projectId, dataset, credential])
}

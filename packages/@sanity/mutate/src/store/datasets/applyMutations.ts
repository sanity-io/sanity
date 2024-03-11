import {type Mutation, type SanityDocumentBase} from '../../mutations/types'
import {getMutationDocumentId} from '../utils/getMutationDocumentId'
import {applyDocumentMutation} from './applyDocumentMutation'

export interface UpdateResult<T extends SanityDocumentBase> {
  id: string
  status: 'created' | 'updated' | 'deleted'
  before?: T
  after?: T
  mutations: Mutation[]
}

/**
 * Takes a list of mutations and applies them to documents in a dataset
 */
export function applyMutations<T extends SanityDocumentBase>(
  mutations: Mutation[],
  dataset: {get: (id: string) => T | undefined},
): UpdateResult<T>[] {
  const updatedDocs: Record<
    string,
    {
      before: T | undefined
      after: T | undefined
      muts: Mutation[]
    }
  > = Object.create(null)

  for (const mutation of mutations) {
    const documentId = getMutationDocumentId(mutation)
    if (!documentId) {
      throw new Error('Unable to get document id from mutation')
    }

    const before = updatedDocs[documentId]?.after || dataset.get(documentId)
    const res = applyDocumentMutation(before, mutation)
    if (res.status === 'error') {
      throw new Error(res.message)
    }
    if (res.status === 'noop') {
      continue
    }
    if (
      res.status === 'updated' ||
      res.status === 'created' ||
      res.status === 'deleted'
    ) {
      if (!(documentId in updatedDocs)) {
        updatedDocs[documentId] = {before, after: undefined, muts: []}
      }
      updatedDocs[documentId].after = res.after
    }
  }

  return Object.entries(updatedDocs).map(
    // eslint-disable-next-line no-shadow
    ([id, {before, after, muts}]) => {
      return {
        id,
        status: after ? (before ? 'updated' : 'created') : 'deleted',
        mutations: muts,
        before,
        after,
      }
    },
  )
}

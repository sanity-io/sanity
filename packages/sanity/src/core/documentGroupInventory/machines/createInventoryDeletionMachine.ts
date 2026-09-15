import {type MultipleMutationResult, type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'
import {fromObservable, fromPromise} from 'xstate'

import {restrictIdsToConfiguredAction} from '../../config/document/bulkDocumentActions'
import {deletionMachine, type ReferringDocuments} from './deletionMachine'

/**
 * Provides the inventory's deletion actors. `getDeletableIds` is read when the
 * deletion is confirmed rather than when the machine is built, so the actor
 * intersects against the latest allowlist even if the machine still holds a
 * wider selection.
 *
 * @internal
 */
export function createInventoryDeletionMachine(options: {
  client: SanityClient
  referringDocuments$: Observable<ReferringDocuments>
  getDeletableIds: () => ReadonlySet<string>
}): typeof deletionMachine {
  const {client, referringDocuments$, getDeletableIds} = options

  return deletionMachine.provide({
    actors: {
      referringDocuments: fromObservable(() => referringDocuments$),
      deleteVariants: fromPromise<MultipleMutationResult, {ids: string[]}>(({input, signal}) => {
        const ids = restrictIdsToConfiguredAction(input.ids, getDeletableIds())

        if (ids.length === 0) {
          return Promise.resolve({
            transactionId: '',
            documentIds: [],
            results: [],
          })
        }

        return ids
          .reduce((pendingTransaction, id) => pendingTransaction.delete(id), client.transaction())
          .commit({
            tag: 'document.delete',
            skipCrossDatasetReferenceValidation: true,
            signal,
          })
      }),
    },
  })
}

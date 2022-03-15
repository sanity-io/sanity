import {MultipleMutationResult} from '@sanity/client'
import {OperationArgs} from '../../types'

export const discardChanges = {
  disabled: ({snapshots}: OperationArgs): 'NO_CHANGES' | 'NOT_PUBLISHED' | false => {
    if (!snapshots.draft) {
      return 'NO_CHANGES'
    }
    if (!snapshots.published) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({client, idPair}: OperationArgs): Promise<MultipleMutationResult> => {
    return client.observable
      .transaction()
      .delete(idPair.draftId)
      .commit({tag: 'document.discard-changes'})
  },
}

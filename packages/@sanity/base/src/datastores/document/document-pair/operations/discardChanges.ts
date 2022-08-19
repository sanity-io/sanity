import {versionedClient} from '../../../../client/versionedClient'
import {OperationArgs} from '../../types'

export const discardChanges = {
  disabled: ({snapshots}: OperationArgs) => {
    if (!snapshots.draft) {
      return 'NO_CHANGES'
    }
    if (!snapshots.published) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({idPair, draft}: OperationArgs) => {
    draft.mutate([draft.delete()])
    return versionedClient.observable
      .transaction()
      .delete(idPair.draftId)
      .commit({tag: 'document.discard-changes'})
  },
}

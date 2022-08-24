import {versionedClient} from '../../../../client/versionedClient'
import {OperationImpl} from './types'

type DisabledReason = 'NO_CHANGES' | 'NOT_PUBLISHED'

export const discardChanges: OperationImpl<[], DisabledReason> = {
  disabled: ({snapshots}) => {
    if (!snapshots.draft) {
      return 'NO_CHANGES'
    }
    if (!snapshots.published) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({idPair}) => {
    return versionedClient.observable
      .transaction()
      .delete(idPair.draftId)
      .commit({tag: 'document.discard-changes'})
  },
}

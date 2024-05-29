import {type OperationImpl} from '../operations/types'

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
  execute: ({client, idPair}) => {
    return client.observable.action(
      {
        actionType: 'sanity.action.document.discard',
        draftId: idPair.draftId,
      },
      {tag: 'document.discard-changes'},
    )
  },
}

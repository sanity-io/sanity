import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'

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
    return actionsApiClient(client).observable.action(
      idPair.draftIds.map((draftId) => ({
        actionType: 'sanity.action.document.discard',
        draftId,
      })),
      {tag: 'document.discard-changes'},
    )
  },
}

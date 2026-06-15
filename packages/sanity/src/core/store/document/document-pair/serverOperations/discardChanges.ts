import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'

type DisabledReason = 'NO_CHANGES'

export const discardChanges: OperationImpl<[], DisabledReason> = {
  disabled: ({snapshots}) => {
    if (!snapshots.draft && !snapshots.version) {
      return 'NO_CHANGES'
    }
    return false
  },
  execute: ({client, idPair}) => {
    return actionsApiClient(client, idPair).observable.action(
      {
        actionType: 'sanity.action.document.discard',
        draftId: idPair.versionId || idPair.draftId,
      },
      {tag: 'document.discard-changes'},
    )
  },
}

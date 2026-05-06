import {actionsApiClient} from '../../document-pair/utils/actionsApiClient'
import {type DocumentOperationImpl} from '../operations/types'

type DisabledReason = 'NO_CHANGES'

export const discardChanges: DocumentOperationImpl<[], DisabledReason> = {
  disabled: ({snapshot}) => (!snapshot ? 'NO_CHANGES' : false),
  execute: ({client, snapshot}) => {
    if (!snapshot) {
      // This should never happen as the operation is disabled if the snapshot is missing
      throw new Error('Cannot discard changes on empty document')
    }

    return actionsApiClient(client).observable.action(
      {
        actionType: 'sanity.action.document.discard',
        draftId: snapshot?._id,
      },
      {tag: 'document.discard-changes'},
    )
  },
}

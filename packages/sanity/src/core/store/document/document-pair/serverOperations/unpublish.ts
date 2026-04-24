import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'

export const unpublish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshots, typeName}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({client, idPair}) =>
    actionsApiClient(client, idPair).observable.action(
      {
        // This operation is run when "unpublish anyway" is clicked
        actionType: 'sanity.action.document.unpublish',
        draftId: idPair.draftId,
        publishedId: idPair.publishedId,
      },
      {
        tag: 'document.unpublish',
        // this disables referential integrity for cross-dataset references. we
        // have this set because we warn against unpublishes in the `ConfirmDeleteDialog`
        // UI.
        skipCrossDatasetReferenceValidation: true,
      },
    ),
}

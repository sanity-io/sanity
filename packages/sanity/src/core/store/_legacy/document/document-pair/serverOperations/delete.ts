import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const del: OperationImpl<[], 'NOTHING_TO_DELETE'> = {
  disabled: ({snapshots}) => (snapshots.draft || snapshots.published ? false : 'NOTHING_TO_DELETE'),
  execute: ({client, schema, idPair, typeName, snapshots}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      const tx = client.observable.transaction().delete(idPair.publishedId)
      return tx.commit({tag: 'document.delete'})
    }

    //the delete action requires a published doc -- discard if not present
    if (!snapshots.published) {
      return actionsApiClient(client, idPair).observable.action(
        {
          actionType: 'sanity.action.document.discard',
          draftId: idPair.draftId,
        },
        {tag: 'document.delete'},
      )
    }

    return actionsApiClient(client, idPair).observable.action(
      {
        actionType: 'sanity.action.document.delete',
        includeDrafts: snapshots.draft ? [idPair.draftId] : [],
        publishedId: idPair.publishedId,
      },
      {
        tag: 'document.delete',
        // this disables referential integrity for cross-dataset references. we
        // have this set because we warn against deletes in the `ConfirmDeleteDialog`
        // UI. This operation is run when "delete anyway" is clicked
        skipCrossDatasetReferenceValidation: true,
      },
    )
  },
}

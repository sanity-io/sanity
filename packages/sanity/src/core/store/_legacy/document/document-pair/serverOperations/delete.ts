import {isPublishedId} from '@sanity/client/csm'

import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'

export const del: OperationImpl<[versions: string[]], 'NOTHING_TO_DELETE'> = {
  disabled: ({snapshots}) => (snapshots.draft || snapshots.published ? false : 'NOTHING_TO_DELETE'),
  execute: ({client, idPair, snapshots}, versions) => {
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
        includeDrafts: versions
          ? // if versions are provided, remove the published id from the list, all versions need to be included in order for the delete to work.
            versions.filter((v) => !isPublishedId(v))
          : snapshots.draft
            ? [idPair.draftId]
            : [],
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

import {isPublishedId} from '@sanity/client/csm'

import {actionsApiClient} from '../../document-pair/utils/actionsApiClient'
import {type DocumentOperationImpl} from '../operations/types'

export const del: DocumentOperationImpl<[versions?: string[]], 'NOTHING_TO_DELETE'> = {
  disabled: ({snapshot}) => (snapshot ? false : 'NOTHING_TO_DELETE'),
  execute: ({client, publishedId, draftId}, versions) => {
    //the delete action requires a published doc -- discard versions if not present
    if (!publishedId) {
      return actionsApiClient(client).observable.action(
        (versions ?? []).map((versionId) => ({
          actionType: 'sanity.action.document.version.discard',
          versionId,
        })),
        {
          skipCrossDatasetReferenceValidation: true,
        },
      )
    }

    return actionsApiClient(client).observable.action(
      {
        actionType: 'sanity.action.document.delete',
        includeDrafts: versions
          ? // if versions are provided, remove the published id from the list, all versions need to be included in order for the delete to work.
            versions.filter((v) => !isPublishedId(v))
          : draftId
            ? [draftId]
            : [],
        publishedId: publishedId,
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

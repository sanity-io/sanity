import {createDraftId} from '@sanity/id-utils'

import {actionsApiClient} from '../../document-pair/utils/actionsApiClient'
import {isLiveEditEnabled} from '../../document-pair/utils/isLiveEditEnabled'
import {type DocumentOperationImpl} from '../operations/types'
import {isPublishedDocument} from './utils'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'

export const unpublish: DocumentOperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshot, typeName}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    if (!snapshot || !isPublishedDocument(snapshot)) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({client, publishedId, draftId, target}) => {
    if (!publishedId) {
      throw new Error('cannot execute "unpublish" when publishedId is not provided')
    }

    actionsApiClient(client).observable.action(
      {
        actionType: 'sanity.action.document.unpublish',
        draftId: draftId || createDraftId(target.baseId),
        publishedId,
      },
      {
        tag: 'document.unpublish',
        // this disables referential integrity for cross-dataset references. we
        // have this set because we warn against unpublishes in the `ConfirmDeleteDialog`
        // UI.
        skipCrossDatasetReferenceValidation: true,
      },
    )
  },
}

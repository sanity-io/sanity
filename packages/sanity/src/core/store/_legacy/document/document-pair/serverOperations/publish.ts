import {type OperationImpl} from '../operations/index'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'

export const publish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, typeName, snapshots}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    if (!snapshots.draft) {
      return snapshots.published ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
    }
    return false
  },
  execute: ({client, idPair, snapshots}) => {
    // The editor must be able to see the draft they are choosing to publish.
    if (!snapshots.draft) {
      throw new Error('cannot execute "publish" when draft is missing')
    }

    return client.observable.action(
      {
        actionType: 'sanity.action.document.publish',
        draftId: idPair.draftId,
        publishedId: idPair.publishedId,
        // The editor must be able to see the latest state of both the draft document they are
        // publishing, and the published document they are choosing to replace. Optimistic
        // locking using `ifDraftRevisionId` and `ifPublishedRevisionId` ensures the client and
        // server are synchronised.
        ifDraftRevisionId: snapshots.draft._rev,
        ifPublishedRevisionId: snapshots.published?._rev,
      },
      {
        tag: 'document.publish',
      },
    )
  },
}

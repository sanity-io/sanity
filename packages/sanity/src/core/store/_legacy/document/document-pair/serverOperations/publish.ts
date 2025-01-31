import {type OperationImpl} from '../operations/index'
import {actionsApiClient} from '../utils/actionsApiClient'
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

    return actionsApiClient(client, idPair).observable.action(
      {
        actionType: 'sanity.action.document.publish',
        draftId: idPair.draftId,
        publishedId: idPair.publishedId,
        // Optimistic locking using `ifPublishedRevisionId` ensures that concurrent publish action
        // invocations do not override each other.
        //
        // Note: for custom publish actions, `snapshots.draft._rev` may be stale, which means the
        // `ifDraftRevisionId` optimistic lock cannot currently be used.
        ifPublishedRevisionId: snapshots.published?._rev,
      },
      {
        tag: 'document.publish',
      },
    )
  },
}

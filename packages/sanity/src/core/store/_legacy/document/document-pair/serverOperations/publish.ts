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
  execute: ({client: globalClient, idPair, snapshots}) => {
    const vXClient = globalClient.withConfig({apiVersion: 'X'})
    const {dataset} = globalClient.config()

    // The editor must be able to see the draft they are choosing to publish.
    if (!snapshots.draft) {
      throw new Error('cannot execute "publish" when draft is missing')
    }

    return vXClient.observable.request({
      url: `/data/actions/${dataset}`,
      method: 'post',
      tag: 'document.publish',
      body: {
        actions: [
          {
            actionType: 'sanity.action.document.publish',
            draftId: idPair.draftId,
            publishedId: idPair.publishedId,
          },
        ],
      },
    })
  },
}

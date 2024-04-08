import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'

export const unpublish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshots, typeName}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({client: globalClient, idPair}) => {
    const vXClient = globalClient.withConfig({apiVersion: 'X'})
    const {dataset} = globalClient.config()

    return vXClient.observable.request({
      url: `/data/actions/${dataset}`,
      method: 'post',
      query: {skipCrossDatasetReferenceValidation: 'true'},
      tag: 'document.unpublish',
      body: {
        actions: [
          {
            actionType: 'sanity.action.document.unpublish',
            draftId: idPair.draftId,
            publishedId: idPair.publishedId,
          },
        ],
      },
    })
  },
}

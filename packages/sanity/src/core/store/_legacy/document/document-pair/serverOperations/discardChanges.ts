import {type OperationImpl} from '../operations/types'

type DisabledReason = 'NO_CHANGES' | 'NOT_PUBLISHED'

export const discardChanges: OperationImpl<[], DisabledReason> = {
  disabled: ({snapshots}) => {
    if (!snapshots.draft) {
      return 'NO_CHANGES'
    }
    if (!snapshots.published) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({client: globalClient, idPair}) => {
    const vXClient = globalClient.withConfig({apiVersion: 'X'})
    const {dataset} = globalClient.config()

    return vXClient.observable.request({
      url: `/data/actions/${dataset}`,
      method: 'post',
      tag: 'document.discard-changes',
      body: {
        actions: [
          {
            actionType: 'sanity.action.document.discard',
            draftId: idPair.draftId,
            publishedId: idPair.publishedId,
          },
        ],
      },
    })
  },
}

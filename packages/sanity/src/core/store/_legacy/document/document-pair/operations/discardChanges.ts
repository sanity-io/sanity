import {type OperationImpl} from './types'

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
  execute: ({client, idPair}) => {
    // TODO: Should be dynamic
    const draftIndex = 0
    return client.observable
      .transaction()
      .delete(idPair.draftIds[draftIndex])
      .commit({tag: 'document.discard-changes'})
  },
}

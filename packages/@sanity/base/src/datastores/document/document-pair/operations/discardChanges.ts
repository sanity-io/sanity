import client from 'part:@sanity/base/client'
import {OperationArgs} from '../../types'

export const discardChanges = {
  disabled: ({snapshots}: OperationArgs) => {
    if (!snapshots.draft) {
      return 'NO_CHANGES'
    }
    if (!snapshots.published) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({idPair}: OperationArgs) => {
    return client.observable.transaction().delete(idPair.draftId).commit()
  },
}

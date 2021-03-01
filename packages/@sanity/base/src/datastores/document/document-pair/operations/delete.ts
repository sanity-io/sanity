import client from 'part:@sanity/base/client'
import {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const del = {
  disabled: ({snapshots}) => (snapshots.draft || snapshots.published ? false : 'NOTHING_TO_DELETE'),
  execute: ({idPair, typeName}: OperationArgs) => {
    const tx = client.observable.transaction().delete(idPair.publishedId)

    if (isLiveEditEnabled(typeName)) {
      return tx.commit()
    }

    return tx.delete(idPair.draftId).commit()
  },
}

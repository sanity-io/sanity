import {OperationArgs} from '../../types'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const unpublish = {
  disabled: ({snapshots, typeName}: OperationArgs) => {
    if (isLiveEditEnabled(typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({idPair, snapshots}: OperationArgs) => {
    let tx = client.observable.transaction().delete(idPair.publishedId)

    if (snapshots.published) {
      tx = tx.createIfNotExists({
        ...omit(snapshots.published, '_updatedAt'),
        _id: idPair.draftId,
        _type: snapshots.published._type,
      })
    }

    return tx.commit()
  },
}

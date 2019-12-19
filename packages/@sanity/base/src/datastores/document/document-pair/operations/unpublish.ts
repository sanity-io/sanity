import {OperationArgs} from '../../types'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'

export const unpublish = {
  disabled: ({snapshots}: OperationArgs) => {
    return snapshots.published ? false : 'This document is not published'
  },
  execute: ({idPair, snapshots}: OperationArgs) => {
    let tx = client.observable.transaction().delete(idPair.publishedId)

    if (snapshots.published) {
      tx = tx.createIfNotExists({
        ...omit(snapshots.published, '_updatedAt'),
        _id: idPair.draftId
      })
    }

    return tx.commit().toPromise()
  }
}

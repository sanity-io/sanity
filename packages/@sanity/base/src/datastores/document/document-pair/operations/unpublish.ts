import {OperationArgs} from '../../types'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'

export const unpublish = {
  disabled: ({snapshots}: OperationArgs) => {
    return snapshots.published ? false : 'This document is already published'
  },
  execute: ({idPair, snapshots}: OperationArgs) => {
    let tx = client.observable.transaction().delete(idPair.publishedId)

    if (snapshots.published) {
      tx = tx.createIfNotExists({
        ...omit(snapshots.published, '_updatedAt'),
        _id: idPair.draftId
      })
    }

    tx.commit()

    // todo: signal error
    //   map(result => ({
    //     type: 'success',
    //     result: result
    //   })),
    //   catchError(error =>
    //     observableOf({
    //       type: 'error',
    //       message: `An error occurred while attempting to unpublish document.
    //   This usually means that you attempted to unpublish a document that other documents
    //   refers to.`,
    //       error
    //     })
    //   )
    // )
    // .subscribe(result => {
    //   this.setStateIfMounted({transactionResult: result})
    // })
  }
}

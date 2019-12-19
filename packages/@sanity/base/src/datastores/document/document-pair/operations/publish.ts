import {OperationArgs} from '../../types'
import client from 'part:@sanity/base/client'

import {omit} from 'lodash'

const id = <T>(id: T): T => id

export const publish = {
  disabled: ({liveEdit, snapshots}: OperationArgs) => {
    if (liveEdit) {
      return 'Cannot publish when liveEdit is enabled for schema type'
    }
    if (!snapshots.draft) {
      return snapshots.published ? 'Already published' : 'No draft to publish'
    }
    return false
  },
  execute: ({idPair, snapshots}: OperationArgs, prepare = id) => {
    const tx = client.observable.transaction()

    if (snapshots.published) {
      // If it exists already, we only want to update it if the revision on the remote server
      // matches what our local state thinks it's at
      tx.patch(idPair.publishedId, {
        // Hack until other mutations support revision locking
        unset: ['_reserved_prop_'],
        ifRevisionID: snapshots.published._rev
      }).createOrReplace({
        ...omit(prepare(snapshots.draft), '_updatedAt'),
        _id: idPair.publishedId
      })
    } else {
      // If the document has not been published, we want to create it - if it suddenly exists
      // before being created, we don't want to overwrite if, instead we want to yield an error
      tx.create({
        ...omit(prepare(snapshots.draft), '_updatedAt'),
        _id: idPair.publishedId
      })
    }
    tx.delete(idPair.draftId)
    return tx.commit().toPromise()
  }
}

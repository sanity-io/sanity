import client from 'part:@sanity/base/client'
import {omit} from 'lodash'
import {OperationArgs} from '../../types'

import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const publish = {
  disabled: ({typeName, snapshots}: OperationArgs) => {
    if (isLiveEditEnabled(typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    if (!snapshots.draft) {
      return snapshots.published ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
    }
    return false
  },
  execute: ({idPair, snapshots}: OperationArgs) => {
    const tx = client.transaction()

    if (!snapshots.published) {
      // If the document has not been published, we want to create it - if it suddenly exists
      // before being created, we don't want to overwrite if, instead we want to yield an error
      tx.create({
        ...omit(snapshots.draft, '_updatedAt'),
        _id: idPair.publishedId,
        _type: snapshots.draft._type,
      })
    } else {
      // If it exists already, we only want to update it if the revision on the remote server
      // matches what our local state thinks it's at
      tx.patch(idPair.publishedId, {
        // Hack until other mutations support revision locking
        unset: ['_revision_lock_pseudo_field_'],
        ifRevisionID: snapshots.published._rev,
      }).createOrReplace({
        ...omit(snapshots.draft, '_updatedAt'),
        _id: idPair.publishedId,
        _type: snapshots.draft._type,
      })
    }

    tx.delete(idPair.draftId)

    return tx.commit()
  },
}

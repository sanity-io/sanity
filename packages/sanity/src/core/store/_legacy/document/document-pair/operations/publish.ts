import {omit} from 'lodash'
import {isReference} from '@sanity/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './index'

function strengthenOnPublish<T = any>(obj: T): T {
  if (isReference(obj)) {
    if (obj._strengthenOnPublish) {
      return omit(
        obj,
        ['_strengthenOnPublish'].concat(obj._strengthenOnPublish.weak ? [] : ['_weak']),
      ) as T
    }
    return obj
  }
  if (typeof obj !== 'object' || !obj) return obj
  if (Array.isArray(obj)) return obj.map(strengthenOnPublish) as T
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, strengthenOnPublish(value)] as const),
  ) as T
}

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'

export const publish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, typeName, snapshots}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    if (!snapshots.draft) {
      return snapshots.published ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
    }
    return false
  },
  execute: ({client, idPair, snapshots}) => {
    if (!snapshots.draft) {
      throw new Error('cannot execute "publish" when draft is missing')
    }
    const value = strengthenOnPublish(omit(snapshots.draft, '_updatedAt'))
    const tx = client.observable.transaction()
    if (!snapshots.draft) {
      throw new Error('cannot execute "publish" when draft is missing')
    }

    if (snapshots.published) {
      // If it exists already, we only want to update it if the revision on the remote server
      // matches what our local state thinks it's at
      tx.patch(idPair.publishedId, {
        // Hack until other mutations support revision locking
        unset: ['_revision_lock_pseudo_field_'],
        ifRevisionID: snapshots.published._rev,
      })

      tx.createOrReplace({
        ...value,
        _id: idPair.publishedId,
        _type: snapshots.draft._type,
      })
    } else {
      // If the document has not been published, we want to create it - if it suddenly exists
      // before being created, we don't want to overwrite if, instead we want to yield an error
      tx.create({
        ...value,
        _id: idPair.publishedId,
        _type: snapshots.draft._type,
      })
    }

    tx.delete(idPair.draftId)

    return tx.commit({tag: 'document.publish', visibility: 'async'})
  },
}

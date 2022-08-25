import {omit} from 'lodash'
import {isReference} from '@sanity/types'
import {luid} from '@sanity/mutator'

import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './index'

function strengthenOnPublish(obj: unknown) {
  if (isReference(obj)) {
    if (obj._strengthenOnPublish) {
      return omit(
        obj,
        ['_strengthenOnPublish'].concat(obj._strengthenOnPublish.weak ? [] : ['_weak'])
      )
    }
    return obj
  }
  if (typeof obj !== 'object' || !obj) return obj
  if (Array.isArray(obj)) return obj.map(strengthenOnPublish)
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, strengthenOnPublish(value)] as const)
  )
}

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'

export const publish: OperationImpl<[], DisabledReason> = {
  disabled: ({typeName, snapshots}) => {
    if (isLiveEditEnabled(typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    if (!snapshots.draft) {
      return snapshots.published ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
    }
    return false
  },
  execute: ({idPair, snapshots, draft, published}) => {
    // flush any pending mutations
    draft.commit()
    published.commit()

    const value = strengthenOnPublish(omit(snapshots.draft, '_updatedAt'))

    if (snapshots.published) {
      // If it exists already, we only want to update it if the revision on the remote server
      // matches what our local state thinks it's at
      published.mutate(
        published.patch([
          {
            unset: ['_revision_lock_pseudo_field_'],
            ifRevisionID: snapshots.published._rev,
          },
        ])
      )

      published.mutate([
        published.createOrReplace({
          ...value,
          _id: idPair.publishedId,
          _type: snapshots.draft._type,
        }),
      ])
    } else {
      // If the document has not been published, we want to create it - if it suddenly exists
      // before being created, we don't want to overwrite if, instead we want to yield an error
      published.mutate([
        published.create({
          ...value,
          _id: idPair.publishedId,
          _type: snapshots.draft._type,
        }),
      ])
    }

    draft.mutate([draft.delete()])

    // Make sure to post mutations on both draft and published in the same transaction
    const transactionId = luid()
    draft.commit(transactionId)
    published.commit(transactionId)
  },
}

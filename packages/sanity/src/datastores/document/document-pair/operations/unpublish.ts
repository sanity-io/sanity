import {omit} from 'lodash'
import type {Observable} from 'rxjs'
import type {MultipleMutationResult} from '@sanity/client'
import type {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const unpublish = {
  disabled: ({
    schema,
    snapshots,
    typeName,
  }: OperationArgs): 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED' | false => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({client, idPair, snapshots}: OperationArgs): Observable<MultipleMutationResult> => {
    let tx = client.observable.transaction().delete(idPair.publishedId)

    if (snapshots.published) {
      tx = tx.createIfNotExists({
        ...omit(snapshots.published, '_updatedAt'),
        _id: idPair.draftId,
        _type: snapshots.published._type,
      })
    }

    return tx.commit({
      tag: 'document.unpublish',
      visibility: 'async',
      // this disables referential integrity for cross-dataset references. we
      // have this set because we warn against unpublishes in the `ConfirmDeleteDialog`
      // UI. This operation is run when "unpublish anyway" is clicked
      skipCrossDatasetReferenceValidation: true,
    })
  },
}

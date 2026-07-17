import omit from 'lodash-es/omit.js'

import {
  assertNotVariantVersion,
  disabledForVariantVersion,
  type VariantVersionDisabledReason,
} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {operationsApiClient} from '../utils/operationsApiClient'
import {type OperationImpl} from './types'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED' | VariantVersionDisabledReason

export const unpublish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshots, typeName}) => {
    // Legacy transaction unpublish. Variant-scoped versions are disabled here — use
    // `serverOperations/unpublish.ts` instead.
    const variantDisabled = disabledForVariantVersion(snapshots?.version)
    if (variantDisabled) {
      return variantDisabled
    }
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({client, idPair, snapshots}) => {
    assertNotVariantVersion(snapshots.version, 'unpublish')

    let tx = operationsApiClient(client, idPair).observable.transaction().delete(idPair.publishedId)

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

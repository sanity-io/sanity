import {
  assertNotVariantVersion,
  disabledForVariantVersion,
  type VariantVersionDisabledReason,
} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {operationsApiClient} from '../utils/operationsApiClient'
import {type OperationImpl} from './types'

export const del: OperationImpl<[], 'NOTHING_TO_DELETE' | VariantVersionDisabledReason> = {
  disabled: ({snapshots}) => {
    // Legacy transaction delete. Variant-scoped versions are disabled here — use
    // `serverOperations/delete.ts` instead.
    const variantDisabled = disabledForVariantVersion(snapshots?.version)
    if (variantDisabled) {
      return variantDisabled
    }
    return snapshots.draft || snapshots.published ? false : 'NOTHING_TO_DELETE'
  },
  execute: ({client, schema, idPair, typeName, snapshots}) => {
    assertNotVariantVersion(snapshots.version, 'delete')
    const tx = operationsApiClient(client, idPair)
      .observable.transaction()
      .delete(idPair.publishedId)

    if (isLiveEditEnabled(schema, typeName)) {
      return tx.commit({tag: 'document.delete'})
    }

    return tx.delete(idPair.draftId).commit({
      tag: 'document.delete',
      // this disables referential integrity for cross-dataset references. we
      // have this set because we warn against deletes in the `ConfirmDeleteDialog`
      // UI. This operation is run when "delete anyway" is clicked
      skipCrossDatasetReferenceValidation: true,
    })
  },
}

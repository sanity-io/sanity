import {
  assertNotVariantVersion,
  disabledForVariantVersion,
  type VariantVersionDisabledReason,
} from '../utils/assertNotVariantVersion'
import {operationsApiClient} from '../utils/operationsApiClient'
import {type OperationImpl} from './types'

type DisabledReason = 'NO_CHANGES' | 'NOT_PUBLISHED' | VariantVersionDisabledReason

export const discardChanges: OperationImpl<[], DisabledReason> = {
  disabled: ({snapshots}) => {
    // Legacy transaction discard-changes. Variant-scoped versions are disabled here — use
    // `serverOperations/discardChanges.ts` instead.
    const variantDisabled = disabledForVariantVersion(snapshots?.version)
    if (variantDisabled) {
      return variantDisabled
    }
    if (!snapshots.draft) {
      return 'NO_CHANGES'
    }
    if (!snapshots.published) {
      return 'NOT_PUBLISHED'
    }
    return false
  },
  execute: ({client, idPair, snapshots}) => {
    assertNotVariantVersion(snapshots.version, 'discardChanges')
    return operationsApiClient(client, idPair)
      .observable.transaction()
      .delete(idPair.draftId)
      .commit({tag: 'document.discard-changes'})
  },
}

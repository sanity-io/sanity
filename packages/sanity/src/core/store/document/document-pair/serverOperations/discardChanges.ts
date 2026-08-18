import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'

type DisabledReason = 'NO_CHANGES'

export const discardChanges: OperationImpl<[], DisabledReason> = {
  disabled: ({snapshots}) => {
    if (!snapshots.draft && !snapshots.version) {
      return 'NO_CHANGES'
    }
    // The variant-of-published document has no draft-ness to discard; removing the published
    // variant is unpublish's job.
    if (getVariantVersionInfo(snapshots.version)?.bundleId === 'published') {
      return 'NO_CHANGES'
    }
    return false
  },
  execute: ({client, idPair, snapshots}) => {
    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion?.bundleId === 'published') {
      throw new Error('Cannot discard changes of a published variant: unpublish it instead')
    }

    return actionsApiClient(client, idPair).observable.action(
      {
        actionType: 'sanity.action.document.version.discard',
        versionId: idPair.versionId || idPair.draftId,
      },
      {tag: 'document.discard-changes'},
    )
  },
}

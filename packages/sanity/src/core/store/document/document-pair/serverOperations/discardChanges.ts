import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {variantActionsApiClient} from '../utils/variantActionsApiClient'

type DisabledReason = 'NO_CHANGES'

export const discardChanges: OperationImpl<[], DisabledReason> = {
  disabled: ({snapshots}) => {
    if (!snapshots.draft && !snapshots.version) {
      return 'NO_CHANGES'
    }
    // TODO: Verify this
    // // The variant-of-published document has no draft-ness to discard; discarding it would
    // // delete the published variant, which is unpublish's job.
    // if (getVariantVersionInfo(snapshots.version)?.bundleId === 'published') {
    //   return 'NO_CHANGES'
    // }
    return false
  },
  execute: ({client, idPair, snapshots}) => {
    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion && variantVersion.bundleId !== 'published') {
      // Discarding a variant draft is deleting the variant document in that bundle. The generic
      // `sanity.action.document.discard` addresses drafts by raw id; the variant action
      // addresses them by (publishedId, variantId, bundleId), which is the supported surface
      // for variant-scoped versions.
      return variantActionsApiClient(client).observable.action(
        {
          actionType: 'sanity.action.document.variant.delete',
          publishedId: idPair.publishedId,
          variantId: variantVersion.variantId,
          bundleId: variantVersion.bundleId,
        },
        {tag: 'document.discard-changes'},
      )
    }

    return actionsApiClient(client, idPair).observable.action(
      {
        actionType: 'sanity.action.document.discard',
        draftId: idPair.versionId || idPair.draftId,
      },
      {tag: 'document.discard-changes'},
    )
  },
}

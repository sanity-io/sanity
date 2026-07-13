import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {assertNotVariantVersion} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {variantActionsApiClient} from '../utils/variantActionsApiClient'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'

export const unpublish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshots, typeName}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }

    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      // Unpublishing a variant requires the variant-of-published document, which is only in the
      // pair when the published perspective is selected (the version snapshot carries no
      // bundleId). From other bundles the sibling's existence is unknown (no pair slot holds
      // it), so the operation stays disabled. (Sibling-stub gating is planned as a follow-up.)
      return variantVersion.bundleId === 'published' ? false : 'NOT_PUBLISHED'
    }

    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({client, idPair, snapshots}) => {
    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      // Deletes the variant-of-published document and moves its content into the target bundle
      // (the variant's draft). The base published and draft documents are never touched.
      return variantActionsApiClient(client).observable.action(
        {
          actionType: 'sanity.action.document.variant.unpublish',
          publishedId: idPair.publishedId,
          variantId: variantVersion.variantId,
          bundleId: 'drafts',
        },
        {
          tag: 'document.unpublish',
          skipCrossDatasetReferenceValidation: true,
        },
      )
    }

    assertNotVariantVersion(snapshots.version, 'unpublish')

    return actionsApiClient(client, idPair).observable.action(
      {
        // This operation is run when "unpublish anyway" is clicked
        actionType: 'sanity.action.document.unpublish',
        draftId: idPair.draftId,
        publishedId: idPair.publishedId,
      },
      {
        tag: 'document.unpublish',
        // this disables referential integrity for cross-dataset references. we
        // have this set because we warn against unpublishes in the `ConfirmDeleteDialog`
        // UI.
        skipCrossDatasetReferenceValidation: true,
      },
    )
  },
}

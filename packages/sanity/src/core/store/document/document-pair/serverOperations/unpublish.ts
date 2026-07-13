import {type SanityDocumentLike} from '@sanity/types'

import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {assertNotVariantVersion} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {variantActionsApiClient} from '../utils/variantActionsApiClient'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED' | 'ALREADY_UNPUBLISHED'

export const unpublish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshots, typeName, idPair}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }

    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      // Unpublishable variant versions:
      // - the variant-of-published document itself (no bundleId), which is hard-unpublished
      // - a release-scoped variant, which is soft-unpublished as part of its release
      // A drafts-scoped variant has nothing published in its slot to unpublish.
      return variantVersion.bundleId !== 'drafts' ? false : 'NOT_PUBLISHED'
    }

    if (idPair.versionId) {
      if (!snapshots.published) {
        return 'NOT_PUBLISHED'
      }
      if ((snapshots.version as SanityDocumentLike | null | undefined)?._system?.delete === true) {
        return 'ALREADY_UNPUBLISHED'
      }
      return false
    }

    return snapshots.published ? false : 'NOT_PUBLISHED'
  },
  execute: ({client, idPair, snapshots}) => {
    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      if (variantVersion.bundleId === 'drafts') {
        throw new Error('Cannot unpublish a draft variant')
      }
      // `bundleId` is the version snapshot's own bundle:
      // - `undefined` (variant-of-published): hard unpublish — the backend deletes the published
      //   variant and creates the variant draft from its content (mirror of base unpublish)
      // - a release id: soft unpublish — the backend marks the release-scoped variant with
      //   `_system.delete: true`, completed when the release is published
      // The base published and draft documents are never touched either way.
      return variantActionsApiClient(client).observable.action(
        {
          actionType: 'sanity.action.document.variant.unpublish',
          publishedId: idPair.publishedId,
          variantId: variantVersion.variantId,
          bundleId: snapshots.version?._system?.bundleId,
        },
        {
          tag: 'document.unpublish',
          skipCrossDatasetReferenceValidation: true,
        },
      )
    }

    if (idPair.versionId) {
      return actionsApiClient(client, idPair).observable.action(
        {
          actionType: 'sanity.action.document.version.unpublish',
          versionId: idPair.versionId,
          publishedId: idPair.publishedId,
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

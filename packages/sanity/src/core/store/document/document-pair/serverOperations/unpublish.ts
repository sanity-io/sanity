import {isGoingToUnpublish} from '../../../../releases/util/isGoingToUnpublish'
import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../../../variants/store/constants'
import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {assertNotVariantVersion} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {variantsApiClient} from '../utils/variantsApiClient'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED' | 'ALREADY_UNPUBLISHED'

export const unpublish: OperationImpl<[], DisabledReason> = {
  disabled: ({schema, snapshots, typeName, idPair}) => {
    if (isLiveEditEnabled(schema, typeName) && !idPair.versionId) {
      return 'LIVE_EDIT_ENABLED'
    }

    // A release version already carrying the unpublish marker would be a no-op: the release
    // publish will remove the published document either way. Reverting it is a separate
    // operation (`revertUnpublishVersion`), not a repeated unpublish.
    if (idPair.versionId && snapshots.version && isGoingToUnpublish(snapshots.version)) {
      return 'ALREADY_UNPUBLISHED'
    }

    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      // Unpublishable variant versions:
      // - the variant-of-published document itself (no bundleId), which is hard-unpublished
      // - a release-scoped variant, which is soft-unpublished as part of its release
      // A drafts-scoped variant has nothing published in its slot to unpublish.
      return variantVersion.bundleId !== 'drafts' ? false : 'NOT_PUBLISHED'
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
      return variantsApiClient(client).observable.action(
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

    assertNotVariantVersion(snapshots.version, 'unpublish')

    if (idPair.versionId) {
      // Unpublishing inside a release is a soft unpublish: the backend marks the release version
      // with `_system.delete: true` and removes the published document when the release is
      // published. The base draft is deliberately absent from the payload — unlike the base
      // unpublish below, nothing is written back into `drafts.<id>`.
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

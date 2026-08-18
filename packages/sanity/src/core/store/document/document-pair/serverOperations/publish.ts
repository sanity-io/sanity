import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {type OperationImpl, type PublishOptions} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {assertNotVariantVersion} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {variantActionsApiClient} from '../utils/variantActionsApiClient'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES' | 'NOT_PUBLISHABLE'

export const publish: OperationImpl<[options?: PublishOptions], DisabledReason> = {
  disabled: ({schema, typeName, snapshots}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }

    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      // The checked-out version IS the variant-of-published document: nothing to publish.
      if (variantVersion.bundleId === 'published') {
        return 'ALREADY_PUBLISHED'
      }
      // Release-scoped variant documents are published as part of their release, mirroring how
      // plain release versions are not publishable by this action.
      if (snapshots.version?._system?.release?._ref) {
        return 'NOT_PUBLISHABLE'
      }
      return false
    }

    if (!snapshots.draft && !snapshots.version) {
      return snapshots.published ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
    }
    return false
  },
  execute: ({client, idPair, snapshots}, options) => {
    // The editor must be able to see the draft they are choosing to publish.
    if (!snapshots.draft && !snapshots.version) {
      throw new Error('cannot execute "publish" when draft or version is missing')
    }
    if (idPair.versionId && !snapshots.version) {
      throw new Error('cannot execute "publish" when version is missing but versionId is provided')
    }

    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      if (variantVersion.bundleId === 'published') {
        throw new Error(
          'cannot execute "publish" on a variant-of-published document: it is already published',
        )
      }

      // Publishes the variant document into the variant-of-published document. The base
      // published document is never touched.
      //
      // `publishedRevisionId` → `ifPublishedVariantRevisionId` locks on the
      // variant-of-published sibling revision (passed from PublishAction via
      // `publishedSibling._rev` — that sibling is not in any pair snapshot slot).
      // `ifSourceRevisionId` is still omitted: the deployed action rejects it
      // (`json: unknown field`).
      // TODO(SAPP): send `ifSourceRevisionId: snapshots.version?._rev` once the action supports it.
      return variantActionsApiClient(client).observable.action(
        {
          actionType: 'sanity.action.document.variant.publish',
          publishedId: idPair.publishedId,
          variantId: variantVersion.variantId,
          bundleId: variantVersion.bundleId,
          ifPublishedVariantRevisionId: options?.publishedRevisionId,
        },
        {tag: 'document.publish'},
      )
    }

    assertNotVariantVersion(snapshots.version, 'publish')

    return actionsApiClient(client, idPair).observable.action(
      {
        actionType: 'sanity.action.document.publish',
        draftId: (snapshots.version?._id || snapshots.draft?._id)!,
        publishedId: idPair.publishedId,
        // Optimistic locking using `ifPublishedRevisionId` ensures that concurrent publish action
        // invocations do not override each other. Prefer an explicit `publishedRevisionId` when
        // provided; otherwise fall back to the published snapshot (the normal draft path).
        //
        // Note: for custom publish actions, `snapshots.draft._rev` may be stale, which means the
        // `ifDraftRevisionId` optimistic lock cannot currently be used.
        ifPublishedRevisionId: options?.publishedRevisionId ?? snapshots.published?._rev,
      },
      {
        tag: 'document.publish',
      },
    )
  },
}

import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {type DocumentRevision} from '../../../history/createHistoryStore'
import {type OperationImpl} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore: OperationImpl<[fromRevision: DocumentRevision]> = {
  disabled: (): false => false,
  execute: (
    {snapshots, historyStore, schema, idPair, typeName},
    fromRevision: DocumentRevision,
  ) => {
    const targetId = idPair.versionId
      ? idPair.versionId
      : isLiveEditEnabled(schema, typeName)
        ? idPair.publishedId
        : idPair.draftId

    // `fromDeleted` means "the restore target does not exist yet", which for a version target is
    // decided by the version snapshot alone — a release version can be absent while the document
    // is published, and present while draft and published are not.
    const fromDeleted = idPair.versionId
      ? !snapshots.version
      : !snapshots.draft && !snapshots.published

    // Variant-scoped versions are indistinguishable from release versions by id shape; the
    // snapshot's `_system` is the discriminator. A variant target without a version document never
    // reaches this point: `createOperationsAPI` guards it with TARGET_NOT_FOUND.
    return historyStore.restore(idPair.publishedId, targetId, fromRevision, {
      fromDeleted,
      useServerDocumentActions: true,
      variant: getVariantVersionInfo(snapshots.version),
    })
  },
}

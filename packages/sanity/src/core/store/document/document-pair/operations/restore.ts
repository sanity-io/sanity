import {type DocumentRevision} from '../../../history'
import {assertNotVariantVersion, disabledForVariantVersion} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

export const restore: OperationImpl<[fromRevision: DocumentRevision]> = {
  // Legacy restore. Variant-scoped versions are disabled here — use `serverOperations/restore.ts`
  // instead.
  disabled: ({snapshots}) => disabledForVariantVersion(snapshots?.version),
  execute: (
    {historyStore, schema, idPair, typeName, snapshots},
    fromRevision: DocumentRevision,
  ) => {
    assertNotVariantVersion(snapshots.version, 'restore')
    const targetId = idPair.versionId
      ? idPair.versionId
      : isLiveEditEnabled(schema, typeName)
        ? idPair.publishedId
        : idPair.draftId

    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

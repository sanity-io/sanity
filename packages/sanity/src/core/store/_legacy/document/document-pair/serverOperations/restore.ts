import {type OperationImpl} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore: OperationImpl<[fromRevision: string]> = {
  disabled: (): false => false,
  execute: ({snapshots, historyStore, schema, idPair, typeName}, fromRevision: string) => {
    // TODO: Should be dynamic
    const draftIndex = 0

    const targetId = isLiveEditEnabled(schema, typeName)
      ? idPair.publishedId
      : idPair.draftIds[draftIndex]

    return historyStore.restore(idPair.publishedId, targetId, fromRevision, {
      fromDeleted: !snapshots.draft && !snapshots.published,
      useServerDocumentActions: true,
    })
  },
}

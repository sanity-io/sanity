import {type OperationImpl} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore: OperationImpl<[fromRevision: string]> = {
  disabled: (): false => false,
  execute: ({snapshots, historyStore, schema, idPair, typeName}, fromRevision: string) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision, {
      fromDeleted: !snapshots.draft && !snapshots.published,
      useServerDocumentActions: true,
    })
  },
}

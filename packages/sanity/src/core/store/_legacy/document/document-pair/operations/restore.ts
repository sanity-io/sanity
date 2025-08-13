import type {DocumentRevision} from '../../../history/createHistoryStore'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

export const restore: OperationImpl<[fromRevision: DocumentRevision]> = {
  disabled: (): false => false,
  execute: ({historyStore, schema, idPair, typeName}, fromRevision: DocumentRevision) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

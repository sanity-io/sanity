import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './types'

export const restore: OperationImpl<[fromRevision: string]> = {
  disabled: (): false => false,
  execute: ({historyStore, schema, idPair, typeName}, fromRevision: string) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

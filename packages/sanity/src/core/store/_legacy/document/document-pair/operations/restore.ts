import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

export const restore: OperationImpl<[fromRevision: string]> = {
  disabled: (): false => false,
  execute: ({historyStore, schema, idPair, typeName}, fromRevision: string) => {
    // TODO: Should be dynamic
    const draftIndex = 0
    const targetId = isLiveEditEnabled(schema, typeName)
      ? idPair.publishedId
      : idPair.draftIds[draftIndex]
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

import {OperationArgs} from '../../types'
import historyStore from 'part:@sanity/base/datastore/history'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore = {
  disabled: (): false => false,
  execute: ({idPair, typeName}: OperationArgs, fromRevision: string) => {
    const targetId = isLiveEditEnabled(typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  }
}

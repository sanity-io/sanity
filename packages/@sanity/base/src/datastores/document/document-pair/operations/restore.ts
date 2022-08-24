// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import historyStore from 'part:@sanity/base/datastore/history'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './types'

export const restore: OperationImpl<[fromRevision: string]> = {
  disabled: (): false => false,
  execute: ({idPair, typeName}, fromRevision: string) => {
    const targetId = isLiveEditEnabled(typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

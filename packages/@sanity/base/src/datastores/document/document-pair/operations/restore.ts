// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import historyStore from 'part:@sanity/base/datastore/history'
import {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore = {
  disabled: (): false => false,
  execute: ({idPair, typeName}: OperationArgs, fromRevision: string) => {
    const targetId = isLiveEditEnabled(typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

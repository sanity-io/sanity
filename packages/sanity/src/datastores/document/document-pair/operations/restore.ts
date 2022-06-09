import {MultipleMutationResult} from '@sanity/client'
import {Observable} from 'rxjs'
import {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore = {
  disabled: (): false => false,
  execute: (
    {historyStore, idPair, schema, typeName}: OperationArgs,
    fromRevision: string
  ): Observable<MultipleMutationResult> => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

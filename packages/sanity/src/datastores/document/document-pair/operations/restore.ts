import type {SanityDocument} from '@sanity/client'
import type {Observable} from 'rxjs'
import type {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restore = {
  disabled: (): false => false,
  execute: (
    {historyStore, idPair, schema, typeName}: OperationArgs,
    fromRevision: string
  ): Observable<SanityDocument> => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restore(idPair.publishedId, targetId, fromRevision)
  },
}

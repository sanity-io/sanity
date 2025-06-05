import {type SanityDocument} from '@sanity/types'

import {type DocumentRevision} from '../../../history'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

export const restoreRevision: OperationImpl<[fromRevision: DocumentRevision]> = {
  disabled: (): false => false,
  execute: ({historyStore, schema, idPair, typeName}, fromRevision: DocumentRevision) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restoreRevision(idPair.publishedId, targetId, fromRevision)
  },
}

export const restoreDocument: OperationImpl<[document: SanityDocument]> = {
  disabled: (): false => false,
  execute: ({historyStore, schema, idPair, typeName}, document: SanityDocument) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restoreDocument(targetId, document)
  },
}

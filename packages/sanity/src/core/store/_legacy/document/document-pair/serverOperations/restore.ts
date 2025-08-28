import {type SanityDocument} from '@sanity/types'

import {type DocumentRevision} from '../../../history'
import {type OperationImpl} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const restoreRevision: OperationImpl<[fromRevision: DocumentRevision]> = {
  disabled: (): false => false,
  execute: (
    {snapshots, historyStore, schema, idPair, typeName},
    fromRevision: DocumentRevision,
  ) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restoreRevision(idPair.publishedId, targetId, fromRevision, {
      fromDeleted: !snapshots.draft && !snapshots.published,
      useServerDocumentActions: true,
    })
  },
}

export const restoreDocument: OperationImpl<[document: SanityDocument]> = {
  disabled: (): false => false,
  execute: ({snapshots, historyStore, schema, idPair, typeName}, document: SanityDocument) => {
    const targetId = isLiveEditEnabled(schema, typeName) ? idPair.publishedId : idPair.draftId
    return historyStore.restoreDocument(targetId, document, {
      fromDeleted: !snapshots.draft && !snapshots.published,
      useServerDocumentActions: true,
    })
  },
}

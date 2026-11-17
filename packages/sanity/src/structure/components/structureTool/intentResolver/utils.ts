import {uuid} from '@sanity/uuid'
import {type Observable} from 'rxjs'
import {type DocumentStore} from 'sanity'

import {PaneResolutionError} from '../../../structureResolvers/PaneResolutionError'

export function ensureDocumentIdAndType(
  documentStore: DocumentStore,
  id: string | undefined,
  type: string | undefined,
): {id: string; type: Observable<string>} {
  if (!id && !type) {
    throw new PaneResolutionError({
      message: 'Neither document `id` or `type` was provided when trying to resolve intent.',
    })
  }

  const documentId = id ?? uuid()
  return {id: documentId, type: documentStore.resolveTypeForDocument(documentId, type)}
}

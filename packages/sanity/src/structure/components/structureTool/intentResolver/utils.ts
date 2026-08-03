import {uuid} from '@sanity/uuid'
import {firstValueFrom} from 'rxjs'
import {type DocumentStore} from 'sanity'

import {PaneResolutionError} from '../../../structureResolvers/PaneResolutionError'

export async function ensureDocumentIdAndType(
  documentStore: DocumentStore,
  id: string | undefined,
  type: string | undefined,
): Promise<{id: string; type: string}> {
  if (id && type) return {id, type}
  if (!id && type) return {id: uuid(), type}
  if (id && !type) {
    const resolvedType = await firstValueFrom(documentStore.resolveTypeForDocument(id))

    return {id, type: resolvedType}
  }

  throw new PaneResolutionError({
    message: 'Neither document `id` or `type` was provided when trying to resolve intent.',
  })
}

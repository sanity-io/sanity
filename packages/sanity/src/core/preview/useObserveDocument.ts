import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {useObservable} from 'react-rx'

import {useDocumentPreviewStore} from '../store/_legacy/datastores'

/**
 * @internal
 * @beta
 *
 * Observes a document by its ID and returns the document and loading state
 * it will listen to the document changes.
 */
export function useObserveDocument<T extends SanityDocument>(
  documentId: string,
  schemaType: ObjectSchemaType,
): {
  baseDocument: T | null
  loading: boolean
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const observePaths = documentPreviewStore.observePaths(
    {_id: documentId},
    schemaType.fields.map((field) => [field.name]),
  )
  const baseDocument = useObservable(observePaths, 'loading') as T | 'loading' | undefined

  return {
    baseDocument: baseDocument === 'loading' ? null : baseDocument || null,
    loading: baseDocument === 'loading',
  }
}

import {useContext} from 'react'
import {DocumentIdAndTypeContext} from './DocumentIdAndTypeContext'
import {DocumentContextError} from './DocumentContextError'

/**
 * Returns the ID of the document without a `drafts.` prefix.
 * @internal
 */
export function useDocumentId(): string {
  const context = useContext(DocumentIdAndTypeContext)
  if (!context) throw new DocumentContextError()

  return context.documentId
}

import {useContext} from 'react'
import {DocumentIdAndTypeContext} from './DocumentIdAndTypeContext'
import {DocumentContextError} from './DocumentContextError'

/**
 * Returns the resolved document type derived from the structure or pulled from
 * the document's `_type`.
 * @internal
 */
export function useDocumentType(): string {
  const context = useContext(DocumentIdAndTypeContext)
  if (!context) throw new DocumentContextError()

  return context.documentType
}

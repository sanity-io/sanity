import {createContext} from 'react'

/**
 * The context value type associated with the `DocumentIdAndTypeProvider`.
 * @internal
 */
export interface DocumentIdAndTypeContextValue {
  /**
   * The published ID of the document.
   */
  documentId: string
  /**
   * The resolved document type. If a document type was not given it will be
   * resolved async using the `resolveTypeForDocument` method from the document
   * store.
   */
  documentType: string
}

/**
 * The react context associated with the `DocumentIdAndTypeProvider`.
 * @internal
 */
export const DocumentIdAndTypeContext = createContext<DocumentIdAndTypeContextValue | null>(null)

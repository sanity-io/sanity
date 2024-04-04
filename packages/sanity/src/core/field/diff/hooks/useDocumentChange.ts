import {useContext} from 'react'
import {DocumentChangeContext, type DocumentChangeContextInstance} from 'sanity/_singleton'

/** @internal */
export function useDocumentChange(): DocumentChangeContextInstance {
  const documentChange = useContext(DocumentChangeContext)

  if (!documentChange) {
    throw new Error('DocumentChange: missing context value')
  }

  return documentChange
}

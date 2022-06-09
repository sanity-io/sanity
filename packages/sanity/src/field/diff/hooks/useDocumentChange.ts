import {useContext} from 'react'
import {
  DocumentChangeContext,
  DocumentChangeContextInstance,
} from '../contexts/DocumentChangeContext'

export function useDocumentChange(): DocumentChangeContextInstance {
  const documentChange = useContext(DocumentChangeContext)

  if (!documentChange) {
    throw new Error('DocumentChange: missing context value')
  }

  return documentChange
}

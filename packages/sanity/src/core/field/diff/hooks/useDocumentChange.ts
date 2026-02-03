import {type DocumentChangeContextInstance} from '../contexts/DocumentChangeContext'
import {useContext} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

/** @internal */
export function useDocumentChange(): DocumentChangeContextInstance {
  const documentChange = useContext(DocumentChangeContext)

  if (!documentChange) {
    throw new Error('DocumentChange: missing context value')
  }

  return documentChange
}

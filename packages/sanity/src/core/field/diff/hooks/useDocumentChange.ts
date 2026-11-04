import {use} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

import {type DocumentChangeContextInstance} from '../contexts/DocumentChangeContext'

/** @internal */
export function useDocumentChange(): DocumentChangeContextInstance {
  const documentChange = use(DocumentChangeContext)

  if (!documentChange) {
    throw new Error('DocumentChange: missing context value')
  }

  return documentChange
}

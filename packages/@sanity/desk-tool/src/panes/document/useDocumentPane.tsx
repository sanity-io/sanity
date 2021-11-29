import {useContext} from 'react'
import type {DocumentPaneContextValue} from './DocumentPaneContext'
import {DocumentPaneContext} from './DocumentPaneContext'

export function useDocumentPane(): DocumentPaneContextValue {
  const documentPane = useContext(DocumentPaneContext)

  if (!documentPane) {
    throw new Error('DocumentPane: missing context value')
  }

  return documentPane
}

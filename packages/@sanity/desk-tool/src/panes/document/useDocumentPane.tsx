import {useContext} from 'react'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'

export function useDocumentPane(): DocumentPaneContextValue {
  const documentPane = useContext(DocumentPaneContext)

  if (!documentPane) {
    throw new Error('DocumentPane: missing context value')
  }

  return documentPane
}

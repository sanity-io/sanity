import {useContext} from 'react'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'

export function useDocumentPane(): DocumentPaneContextValue {
  return useContext(DocumentPaneContext)
}

import {useContext} from 'react'
import {DocumentPaneInfoContext} from 'sanity/_singletons'

import {type DocumentPaneInfoContextValue} from './DocumentPaneContext'

/** @internal */
export function useDocumentPaneInfo(): DocumentPaneInfoContextValue {
  const documentPaneInfo = useContext(DocumentPaneInfoContext)

  if (!documentPaneInfo) {
    throw new Error('DocumentPane: missing info context value')
  }

  return documentPaneInfo
}

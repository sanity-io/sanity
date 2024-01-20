import {useContext} from 'react'

import {DocumentPaneContext, type DocumentPaneContextValue} from './DocumentPaneContext'

/** @internal */
export function useDocumentPane(): DocumentPaneContextValue {
  const documentPane = useContext(DocumentPaneContext)

  if (!documentPane) {
    throw new Error('DocumentPane: missing context value')
  }

  return documentPane
}

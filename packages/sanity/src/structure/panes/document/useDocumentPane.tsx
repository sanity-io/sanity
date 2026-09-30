import {use} from 'react'
import {DocumentPaneContext} from 'sanity/_singletons'

import {type DocumentPaneContextValue} from './DocumentPaneContext'

/** @internal */
export function useDocumentPane(): DocumentPaneContextValue {
  const documentPane = use(DocumentPaneContext)

  if (!documentPane) {
    throw new Error('DocumentPane: missing context value')
  }

  return documentPane
}

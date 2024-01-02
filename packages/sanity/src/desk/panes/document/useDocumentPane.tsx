/* eslint-disable camelcase */
import {useContext, useDebugValue} from 'react'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'

/** @deprecated use one of the new hooks */
export function useDocumentPane__LEGACY__STOP__USING(): DocumentPaneContextValue {
  const documentPane = useContext(DocumentPaneContext)

  useDebugValue('LEGACY STOP USING')

  if (!documentPane) {
    throw new Error('DocumentPane: missing context value')
  }

  return documentPane
}

/** @deprecated use one of the new hooks */
export const useDocumentPane = useDocumentPane__LEGACY__STOP__USING

import {DocumentPaneContext} from 'sanity/_singletons'
import {type Context, useContextSelector} from 'use-context-selector'

import {type DocumentPaneContextValue} from './DocumentPaneContext'

/** @internal */
export function useDocumentPane<T = DocumentPaneContextValue>(
  selector?: (value: DocumentPaneContextValue) => T,
): T {
  const selectorFn = selector || ((value: DocumentPaneContextValue) => value as T)
  const documentPane = useContextSelector<DocumentPaneContextValue, T>(
    DocumentPaneContext as Context<DocumentPaneContextValue>,
    selectorFn,
  )

  return documentPane
}

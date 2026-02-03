import {createContext} from 'sanity/_createContext'

import type {DocumentPaneContextValue} from '../../structure/panes/document/DocumentPaneContext'

/** @internal */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(
  'sanity/_singletons/context/document-pane',
  null,
)

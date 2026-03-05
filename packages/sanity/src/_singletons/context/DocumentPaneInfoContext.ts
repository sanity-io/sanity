import {createContext} from 'sanity/_createContext'

import type {DocumentPaneInfoContextValue} from '../../structure/panes/document/DocumentPaneContext'

/** @internal */
export const DocumentPaneInfoContext = createContext<DocumentPaneInfoContextValue | null>(
  'sanity/_singletons/context/document-pane-info',
  null,
)

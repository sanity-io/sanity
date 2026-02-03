import type {DocumentPaneContextValue} from '../../structure/panes/document/DocumentPaneContext'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(
  'sanity/_singletons/context/document-pane',
  null,
)

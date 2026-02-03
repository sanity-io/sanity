import type {DocumentSheetListContextValue} from '../../structure/panes/documentList/sheetList/DocumentSheetListProvider'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const DocumentSheetListContext = createContext<DocumentSheetListContextValue | undefined>(
  'sanity/_singletons/context/document-sheet-list',
  undefined,
)

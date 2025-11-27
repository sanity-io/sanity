import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {DocumentSheetListContextValue} from '../../structure/panes/documentList/sheetList/DocumentSheetListProvider'

/** @internal */
export const DocumentSheetListContext: Context<DocumentSheetListContextValue | undefined> =
  createContext<DocumentSheetListContextValue | undefined>(
    'sanity/_singletons/context/document-sheet-list',
    undefined,
  )

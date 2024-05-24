import {createContext} from 'react'

import type {DocumentSheetListContextValue} from '../../../../structure/panes/documentList/sheetList/DocumentSheetListProvider'

/** @internal */
export const DocumentSheetListContext = createContext<DocumentSheetListContextValue | undefined>(
  undefined,
)

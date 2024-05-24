import {createContext} from 'react'

import type {SheetListContextValue} from '../../../../structure/panes/documentList/sheetList/SheetListSelectionProvider'

/** @internal */
export const SheetListContext = createContext<SheetListContextValue | undefined>(undefined)

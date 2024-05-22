import {createContext} from 'react'

import type {SheetListContextValue} from '../../../../structure/panes/documentList/sheetList/SheetListProvider'

export const SheetListContext = createContext<SheetListContextValue | undefined>(undefined)

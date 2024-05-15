import {createContext} from 'react'

import type {SheetListContextValue} from '../../../../structure/panes/documentList/SheetListContext'

export const SheetListContext = createContext<SheetListContextValue | undefined>(undefined)

import {createContext} from 'react'

import type {DocumentPaneInfoContextValue} from '../../structure/panes/document/DocumentPaneContext'

/** @internal */
export const DocumentPaneInfoContext = createContext<DocumentPaneInfoContextValue | null>(null)

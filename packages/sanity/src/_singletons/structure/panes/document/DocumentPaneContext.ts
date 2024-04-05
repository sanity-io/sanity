import {createContext} from 'react'

import type {DocumentPaneContextValue} from '../../../../structure/panes/document/DocumentPaneContext'

/** @internal */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)

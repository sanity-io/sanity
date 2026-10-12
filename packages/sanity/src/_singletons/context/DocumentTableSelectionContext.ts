import {createContext} from 'sanity/_createContext'

import type {DocumentTableSelectionContextValue} from '../../core/releases/tool/components/Table/types'

/**
 * @internal
 */
export const DocumentTableSelectionContext =
  createContext<DocumentTableSelectionContextValue | null>(
    'sanity/_singletons/context/document-table-selection',
    null,
  )

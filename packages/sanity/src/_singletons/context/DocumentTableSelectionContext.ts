import {createContext} from 'react'

import type {DocumentTableSelectionContextValue} from '../../core/releases/tool/components/Table/types'

/**
 * @internal
 */
export const DocumentTableSelectionContext =
  createContext<DocumentTableSelectionContextValue | null>(null)

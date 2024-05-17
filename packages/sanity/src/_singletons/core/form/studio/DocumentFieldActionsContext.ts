import {createContext} from 'react'

import type {DocumentFieldAction} from '../../../../core/config/document/fieldActions/types'

/**
 * @internal
 */
export interface DocumentFieldActionsContextValue {
  actions: DocumentFieldAction[]
}

/**
 * @internal
 */
export const DocumentFieldActionsContext = createContext<DocumentFieldActionsContextValue | null>(
  null,
)

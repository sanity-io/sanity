import {createContext} from 'react'
import type {DocumentFieldAction} from 'sanity'

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

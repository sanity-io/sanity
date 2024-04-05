import {createContext} from 'react'

/**
 * @internal
 */
export interface DocumentIdContextValue {
  id: string
}

/**
 * @internal
 */
export const DocumentIdContext = createContext<DocumentIdContextValue | null>(null)

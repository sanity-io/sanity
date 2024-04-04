import {createContext} from 'react'

/**
 * @internal
 * @hidden
 */
export interface DocumentIdContextValue {
  id: string
}

/**
 * @internal
 * @hidden
 */
export const DocumentIdContext = createContext<DocumentIdContextValue | null>(null)

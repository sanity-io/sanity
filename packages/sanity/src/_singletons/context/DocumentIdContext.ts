import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export interface DocumentIdContextValue {
  id: string
}

/**
 * @internal
 */
export const DocumentIdContext: Context<DocumentIdContextValue | null> =
  createContext<DocumentIdContextValue | null>('sanity/_singletons/context/document-id', null)

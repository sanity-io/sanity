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
export const DocumentIdContext = createContext<DocumentIdContextValue | null>(
  'sanity/_singletons/context/document-id',
  null,
)

import {createContext} from 'react'

export interface DocumentIdContextValue {
  id: string
}

export const DocumentIdContext = createContext<DocumentIdContextValue | null>(null)

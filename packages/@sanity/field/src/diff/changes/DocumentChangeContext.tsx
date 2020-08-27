import {createContext} from 'react'
import {SchemaType} from '../types'

export type DocumentChangeContextProps = {
  documentId: string
  schemaType: SchemaType
}

export const DocumentChangeContext = createContext<DocumentChangeContextProps>({} as any)

import {createContext} from 'react'
import {ObjectDiff, SchemaType} from '../../types'

export type DocumentChangeContextProps = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
}

export const DocumentChangeContext = createContext<DocumentChangeContextProps>({} as any)

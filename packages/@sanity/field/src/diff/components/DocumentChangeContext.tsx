import {createContext} from 'react'
import {ObjectDiff, SchemaType} from '../../types'

export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
}

export const DocumentChangeContext = createContext<DocumentChangeContextInstance>({} as any)

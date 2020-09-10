import {createContext} from 'react'
import {ObjectDiff, SchemaType, Path} from '../../types'

export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
  FieldWrapper: React.ComponentType<{path: Path; children: React.ReactNode}>
}

export const DocumentChangeContext = createContext<DocumentChangeContextInstance>({} as any)

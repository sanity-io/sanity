import {createContext} from 'react'
import type {ObjectDiff, SchemaType} from '../../types'
import type {Path} from '@sanity/types'

export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
  FieldWrapper: React.ComponentType<{path: Path; children: React.ReactNode; hasHover: boolean}>
}

export const DocumentChangeContext = createContext<DocumentChangeContextInstance>({} as any)

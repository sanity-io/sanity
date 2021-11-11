import {createContext} from 'react'
import {Path, SanityDocument} from '@sanity/types'
import {ObjectDiff, SchemaType} from '../../types'

export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
  FieldWrapper: React.ComponentType<{path: Path; children: React.ReactNode; hasHover: boolean}>
  value: Partial<SanityDocument>
}

export const DocumentChangeContext = createContext<DocumentChangeContextInstance>({} as any)

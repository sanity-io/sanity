import {Path, SanityDocument, SchemaType} from '@sanity/types'
import {createContext} from 'react'
import {ObjectDiff} from '../../types'

/** @internal */
export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
  FieldWrapper: React.ComponentType<{path: Path; children: React.ReactNode; hasHover: boolean}>
  value: Partial<SanityDocument>
}

/** @internal */
export const DocumentChangeContext = createContext<DocumentChangeContextInstance | null>(null)

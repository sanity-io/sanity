import {type Path, type SanityDocument, type SchemaType} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'

import {type ObjectDiff} from '../../types'

/** @internal */
export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
  FieldWrapper: ComponentType<{path: Path; children: ReactNode; hasHover: boolean}>
  value: Partial<SanityDocument>
}

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
  /**
   * When comparing two values it decides if it shows the original "from" value in the Diff components.
   * Useful for the DocumentDiff in releases when showing the diff for a new document.
   */
  showFromValue: boolean
}

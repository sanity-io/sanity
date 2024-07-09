import {type Table} from '@tanstack/react-table'
import {
  type BooleanSchemaType,
  type IdPair,
  type NumberSchemaType,
  type SanityDocument,
  type StringSchemaType,
} from 'sanity'

/**
 * Type definition for the row values in the sheet list
 */
export type DocumentSheetTableRow = SanityDocument & {
  __metadata: {
    idPair: IdPair
    snapshots: {
      draft: SanityDocument | null
      published: SanityDocument | null
    }
  }
}

/**
 * Type definition for the table instance used in the sheet list
 */
export type DocumentSheetListTable = Table<DocumentSheetTableRow>

export type DocumentSheetListValueTypes = string | number | boolean

export type DocumentSheetListSchemaTypes = StringSchemaType | NumberSchemaType | BooleanSchemaType

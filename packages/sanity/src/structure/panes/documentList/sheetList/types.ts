import {type Table} from '@tanstack/react-table'
import {type IdPair, type SanityDocument} from 'sanity'

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

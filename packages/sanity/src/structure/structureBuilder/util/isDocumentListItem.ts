import {isRecord} from 'sanity'

import {type DocumentListItem} from '../DocumentListItem'

/** @internal */
export function isDocumentListItem(item: unknown): item is DocumentListItem {
  return isRecord(item) && typeof item.schemaType !== 'undefined' && typeof item._id === 'string'
}

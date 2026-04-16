import {isReference} from '@sanity/types'

import {type Previewable} from '../types'

/**
 * Extracts a document ID from a previewable value.
 * Returns `_ref` for references, `_id` for documents, or `undefined`.
 * @internal
 */
export function getDocumentId(value: Previewable): string | undefined {
  if (isReference(value)) {
    return value._ref
  }
  return '_id' in value ? value._id : undefined
}

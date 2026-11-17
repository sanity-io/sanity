/* oxlint-disable no-deprecated -- this module implements the deprecated legacy document timeline */
import {type CombinedDocument} from './types'

export function getAttrs(doc: CombinedDocument): Record<string, unknown> | null {
  return doc.draft || doc.published
}

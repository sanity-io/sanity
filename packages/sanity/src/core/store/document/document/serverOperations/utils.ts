import {isDraftId, isPublishedId, isVersionId} from '@sanity/client/csm'
import {type SanityDocument} from '@sanity/types'

export const isPublishedDocument = (document: SanityDocument): boolean => {
  /**
   * TODO: When migrating to the new document ids model we need to
   * verify the `_system` field instead . e.g. document._system.variant == "published"
   */
  return isPublishedId(document._id)
}

export const isDraftDocument = (document: SanityDocument): boolean => {
  /**
   * TODO: When migrating to the new document ids model we need to
   * verify the `_system` field instead . e.g. document._system.variant == "draft"
   */
  // Drafts and versions are both considered draft documents.
  return isDraftId(document._id) || isVersionId(document._id)
}

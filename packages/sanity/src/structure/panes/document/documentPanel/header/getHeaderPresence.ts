import {type DocumentPresence} from 'sanity'

/**
 * Picks the presence the document header shows: people at the document root of the exact
 * version the pane displays.
 *
 * The presence store matches every version of a document by its published id, and each report
 * carries the exact version id the person is on. The header reads as "who is on this version
 * with you", so a person on another version (the draft, a release, a variant) is left out.
 * The document list keeps the merged presence across versions.
 *
 * @param presence - presence for the document, across all of its versions
 * @param displayedDocumentId - the id of the version the pane displays (the form value's `_id`)
 * @internal
 */
export function getHeaderPresence(
  presence: DocumentPresence[],
  displayedDocumentId: string,
): DocumentPresence[] {
  return presence.filter(
    (item) => item.path.length === 0 && item.documentId === displayedDocumentId,
  )
}

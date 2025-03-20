import {WarningOutlineIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'

function getMissingDocumentFallback(document: Partial<SanityDocument> | PreviewValue) {
  return {
    title: <em>{document.title ? String(document.title) : 'Missing document'}</em>,
    subtitle: (
      <em>
        {document.title ? `Missing document ID: ${document._id}` : `Document ID: ${document._id}`}
      </em>
    ),
    media: () => <WarningOutlineIcon />,
  }
}

/**
 * @internal
 */
export type Sources = {
  /**
   * Preview snapshot with current perspective applied
   * This takes priority of original and fallback
   */
  snapshot?: Partial<SanityDocument> | PreviewValue | null | undefined
  /**
   * Preview of the original document (e.g. without current perspective applied)
   */
  original?: Partial<SanityDocument> | PreviewValue | null | undefined
  /**
   * last resort fallback in case we don't have anything to preview
   * this can be a hard-coded preview value, or a document stub
   */
  fallback?: Partial<SanityDocument> | PreviewValue
}

const EMPTY: {[key: string]: never} = {}

/**
 * Obtain document preview values used in <SanityPreview> and <SanityDefaultPreview> components.
 * Also displays fallback values if the document cannot be found.
 *
 * @internal
 */
export function getPreviewValueWithFallback({snapshot, original, fallback}: Sources) {
  return snapshot || original || getMissingDocumentFallback(fallback || EMPTY)
}

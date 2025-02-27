import {WarningOutlineIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {assignWith} from 'lodash'

export function getMissingDocumentFallback(document: Partial<SanityDocument> | PreviewValue) {
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
 * Obtain document preview values used in <SanityPreview> and <SanityDefaultPreview> components.
 * Also displays fallback values if the document cannot be found.
 *
 * @internal
 */
export function getPreviewValueWithFallback({
  snapshot,
  original,
  document,
}: {
  document?: Partial<SanityDocument> | PreviewValue | null | undefined
  snapshot?: Partial<SanityDocument> | PreviewValue | null | undefined
  original?: Partial<SanityDocument> | PreviewValue | null | undefined
}) {
  if (document && !original && !snapshot) {
    return getMissingDocumentFallback(document)
  }
  return assignWith({}, snapshot, original, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  }) as PreviewValue
}

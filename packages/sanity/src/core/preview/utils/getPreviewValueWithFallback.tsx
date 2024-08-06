import {WarningOutlineIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {assignWith} from 'lodash'

const getMissingDocumentFallback = (item: SanityDocument) => ({
  title: <em>{item.title ? String(item.title) : 'Missing document'}</em>,
  subtitle: <em>{item.title ? `Missing document ID: ${item._id}` : `Document ID: ${item._id}`}</em>,
  media: () => <WarningOutlineIcon />,
})

/**
 * Obtain document preview values used in <SanityPreview> and <SanityDefaultPreview> components.
 * Also displays fallback values if the document cannot be found.
 *
 * @internal
 */
export const getPreviewValueWithFallback = ({
  value,
  draft,
  published,
  version,
  perspective,
}: {
  value: SanityDocument
  draft?: Partial<SanityDocument> | PreviewValue | null
  published?: Partial<SanityDocument> | PreviewValue | null
  version?: Partial<SanityDocument> | PreviewValue | null
  perspective?: string
}) => {
  let snapshot: Partial<SanityDocument> | PreviewValue | null | undefined

  switch (true) {
    case perspective?.startsWith('bundle.'):
      snapshot = version || draft || published
      break
    case perspective === 'published':
      snapshot = published || draft
      break
    default:
      snapshot = draft || published
  }

  if (!snapshot) {
    return getMissingDocumentFallback(value)
  }

  return assignWith({}, snapshot, value, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  }) as PreviewValue
}

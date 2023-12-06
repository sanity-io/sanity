import {PreviewValue, SanityDocument} from '@sanity/types'
import {useRelativeTime} from './useRelativeTime'

/**
 * React hook which returns a human readable string of the provided document's status.
 *
 * @internal
 * @hidden
 */
export function useDocumentStatusTimeAgo({
  draft,
  hidePublishedDate,
  published,
}: {
  draft?: PreviewValue | Partial<SanityDocument> | null
  hidePublishedDate?: boolean
  published?: PreviewValue | Partial<SanityDocument> | null
}): string | undefined {
  const draftUpdatedAt = draft && '_updatedAt' in draft ? draft._updatedAt : ''
  const publishedUpdatedAt = published && '_updatedAt' in published ? published._updatedAt : ''

  const updatedDateTimeAgo = useRelativeTime(draftUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  const publishedTimeAgo = useRelativeTime(publishedUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  let label

  // Published with no changes
  // @todo: localize correctly
  if (!draftUpdatedAt && publishedTimeAgo) {
    label = `Published${hidePublishedDate ? '' : ` ${publishedTimeAgo}`}`
  }
  // Draft, but no published document
  if (draftUpdatedAt && !publishedTimeAgo) {
    label = `Not published`
  }
  // Published with draft changes
  if (draftUpdatedAt && publishedTimeAgo) {
    label = `Published${hidePublishedDate ? '' : ` ${publishedTimeAgo}`}`
  }
  // Append draft last updated date
  if (label && updatedDateTimeAgo) {
    label += ` (Updated ${updatedDateTimeAgo})`
  }

  return label
}

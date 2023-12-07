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

  // @todo: localize correctly

  const documentStatus = [
    // Published status
    publishedTimeAgo
      ? `Published${hidePublishedDate ? '' : ` ${publishedTimeAgo}`}`
      : `Not published`,
    // Last updated (draft) status
    ...(updatedDateTimeAgo ? [`(Updated ${updatedDateTimeAgo})`] : []),
  ]

  return documentStatus.join(' ')
}

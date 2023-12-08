import {PreviewValue, SanityDocument} from '@sanity/types'
import {useIntlDateTimeFormat} from '../i18n'
import {useRelativeTime} from './useRelativeTime'

interface DocumentStatusTimeAgoOptions {
  draft?: PreviewValue | Partial<SanityDocument> | null
  hidePublishedDate?: boolean
  published?: PreviewValue | Partial<SanityDocument> | null
  absoluteDate?: boolean
}

/**
 * React hook which returns a human readable string of the provided document's status.
 *
 * @internal
 * @hidden
 */
export function useDocumentStatus({
  absoluteDate,
  draft,
  hidePublishedDate,
  published,
}: DocumentStatusTimeAgoOptions): string | undefined {
  const draftUpdatedAt = draft && '_updatedAt' in draft ? draft._updatedAt : ''
  const publishedUpdatedAt = published && '_updatedAt' in published ? published._updatedAt : ''

  const intlDateFormat = useIntlDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const draftDateAbsolute = draftUpdatedAt && intlDateFormat.format(new Date(draftUpdatedAt))
  const publishedDateAbsolute =
    publishedUpdatedAt && intlDateFormat.format(new Date(publishedUpdatedAt))

  const draftUpdatedTimeAgo = useRelativeTime(draftUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  const publishedUpdatedTimeAgo = useRelativeTime(publishedUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  const publishedDate = absoluteDate ? publishedDateAbsolute : publishedUpdatedTimeAgo
  const updatedDate = absoluteDate ? draftDateAbsolute : draftUpdatedTimeAgo

  const documentStatus = [
    // Published status
    publishedUpdatedTimeAgo
      ? `Published${hidePublishedDate ? '' : ` ${publishedDate}`}`
      : `Not published`,
    // Last updated (draft) status
    ...(draftUpdatedTimeAgo ? [`(Updated ${updatedDate})`] : []),
  ]

  return documentStatus.join(' ')
}

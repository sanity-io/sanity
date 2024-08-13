import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {useDateTimeFormat, useRelativeTime} from '../../hooks'
import {useTranslation} from '../../i18n'

interface DocumentStatusProps {
  absoluteDate?: boolean
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  version?: PreviewValue | Partial<SanityDocument> | null
  singleLine?: boolean
}

const StyledText = styled(Text)`
  white-space: nowrap;
`

/**
 * Displays document status indicating both last published and edited dates in either relative (the default)
 * or absolute formats.
 *
 * These can be displayed in a single or multi-line (the default) lockups.
 *
 * Example: `**Published Oct 16 2023** Edited 8m ago`
 *
 * @internal
 */
export function DocumentStatus({
  absoluteDate,
  draft,
  published,
  version,
  singleLine,
}: DocumentStatusProps) {
  const {t} = useTranslation()
  const draftUpdatedAt = draft && '_updatedAt' in draft ? draft._updatedAt : ''
  const versionUpdatedAt = version && '_updatedAt' in version ? version._updatedAt : ''
  const publishedUpdatedAt = published && '_updatedAt' in published ? published._updatedAt : ''

  const intlDateFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const draftDateAbsolute = draftUpdatedAt && intlDateFormat.format(new Date(draftUpdatedAt))
  const publishedDateAbsolute =
    publishedUpdatedAt && intlDateFormat.format(new Date(publishedUpdatedAt))
  const versionDateAbsolute = versionUpdatedAt && intlDateFormat.format(new Date(versionUpdatedAt))

  const draftUpdatedTimeAgo = useRelativeTime(draftUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  const publishedUpdatedTimeAgo = useRelativeTime(publishedUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  const versionUpdatedTimeAgo = useRelativeTime(versionUpdatedAt || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  const publishedDate = absoluteDate ? publishedDateAbsolute : publishedUpdatedTimeAgo
  const updatedDate = absoluteDate
    ? versionDateAbsolute || draftDateAbsolute
    : versionUpdatedTimeAgo || draftUpdatedTimeAgo

  return (
    <Flex
      align={singleLine ? 'center' : 'flex-start'}
      data-testid="pane-footer-document-status"
      direction={singleLine ? 'row' : 'column'}
      gap={2}
      wrap="nowrap"
    >
      {!version && !publishedDate && (
        <StyledText size={1} weight="medium">
          {t('document-status.not-published')}
        </StyledText>
      )}
      {!version && publishedDate && (
        <StyledText size={1} weight="medium">
          {t('document-status.published', {date: publishedDate})}
        </StyledText>
      )}
      {updatedDate && (
        <StyledText muted size={1} wrap="nowrap">
          {t('document-status.edited', {date: updatedDate})}
        </StyledText>
      )}
    </Flex>
  )
}

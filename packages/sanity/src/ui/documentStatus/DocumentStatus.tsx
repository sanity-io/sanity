import {PreviewValue, SanityDocument} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import styled from 'styled-components'
import {useDateTimeFormat, useRelativeTime} from '../../core'

interface DocumentStatusProps {
  absoluteDate?: boolean
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  singleLine?: boolean
}

const StyledText = styled(Text)`
  white-space: nowrap;
`

export function DocumentStatus({absoluteDate, draft, published, singleLine}: DocumentStatusProps) {
  const draftUpdatedAt = draft && '_updatedAt' in draft ? draft._updatedAt : ''
  const publishedUpdatedAt = published && '_updatedAt' in published ? published._updatedAt : ''

  const intlDateFormat = useDateTimeFormat({
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

  // @todo: localize
  return (
    <Flex
      align={singleLine ? 'center' : 'flex-start'}
      direction={singleLine ? 'row' : 'column'}
      gap={2}
      wrap="nowrap"
    >
      {!publishedDate && (
        // eslint-disable-next-line i18next/no-literal-string
        <StyledText size={1} weight="medium">
          Not published
        </StyledText>
      )}
      {publishedDate && (
        // eslint-disable-next-line i18next/no-literal-string
        <StyledText size={1} weight="medium">
          Published {publishedDate}
        </StyledText>
      )}
      {updatedDate && (
        // eslint-disable-next-line i18next/no-literal-string
        <StyledText muted size={1} wrap="nowrap">
          Edited {updatedDate}
        </StyledText>
      )}
    </Flex>
  )
}

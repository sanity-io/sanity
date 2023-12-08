import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, ButtonTone, Flex} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'

export interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  hidePublishedStatus?: boolean
  published?: PreviewValue | Partial<SanityDocument> | null
}

const SIZE = 5 // px

const Dot = styled(Box)<{$draft?: boolean; $hidePublishedStatus: boolean; $published: boolean}>(({
  theme,
  $draft,
  $hidePublishedStatus,
  $published,
}) => {
  let tone: ButtonTone = 'default'
  if ($published) {
    tone = $draft ? 'caution' : 'positive'
  }

  return css`
    background: ${$published
      ? theme.sanity.v2?.color.selectable[tone].disabled.badge[tone].icon
      : theme.sanity.v2?.color.selectable[tone].disabled.badge[tone].dot};
    border-radius: ${SIZE}px;
    display: ${$hidePublishedStatus && $published && !$draft ? 'none' : 'block'};
    height: ${SIZE}px;
    opacity: ${$hidePublishedStatus && $published && !$draft ? 0 : 1};
    width: ${SIZE}px;

    [data-ui='PreviewCard']:hover & {
      opacity: 1;
    }
    [data-ui='PreviewCard'][data-selected] & {
      opacity: 1;
    }
    [data-ui='ReferenceLinkCard']:hover & {
      opacity: 1;
    }
  `
})

export function DocumentStatusIndicator({
  draft,
  hidePublishedStatus,
  published,
}: DocumentStatusProps) {
  if (!draft && !published) {
    return null
  }

  return (
    <Flex align="center" height="fill" justify="center" style={{flexShrink: 0}}>
      <Dot $draft={!!draft} $hidePublishedStatus={!!hidePublishedStatus} $published={!!published} />
    </Flex>
  )
}

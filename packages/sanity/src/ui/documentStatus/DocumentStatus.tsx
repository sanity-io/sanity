import {CheckmarkIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, ButtonTone, Flex} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'
import {TextWithTone, useDocumentStatusTimeAgo} from '../../core'

export interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  showPublishedIcon?: boolean
}

const SIZE = 5 // px

const Dot = styled(Box)<{$draft?: boolean; $published: boolean}>(({theme, $draft, $published}) => {
  let tone: ButtonTone = 'default'
  if ($published) {
    tone = $draft ? 'caution' : 'positive'
  }

  return css`
    background: ${$published
      ? theme.sanity.color.solid[tone].enabled.bg
      : 'var(--card-muted-fg-color)'};
    border-radius: ${SIZE}px;
    height: ${SIZE}px;
    opacity: ${$published ? 1 : 0.25};
    width: ${SIZE}px;
  `
})

export function DocumentStatus({draft, published, showPublishedIcon}: DocumentStatusProps) {
  const statusTimeAgo = useDocumentStatusTimeAgo({draft, published})

  if (!draft && !published) {
    return null
  }

  if (!draft && published) {
    if (showPublishedIcon) {
      return (
        <TextWithTone size={1} tone="positive">
          <CheckmarkIcon aria-label={statusTimeAgo} />
        </TextWithTone>
      )
    }
    return null
  }

  return (
    <Flex align="center" height="fill" justify="center" style={{flexShrink: 0}}>
      <Dot aria-label={statusTimeAgo} $draft={!!draft} $published={!!published} />
    </Flex>
  )
}

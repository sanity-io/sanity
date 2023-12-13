import {LaunchIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const FEEDBACK_FORM_LINK = 'https://snty.link/comments-beta-feedback'

const Span = styled.span`
  margin-right: 0.2em;
`

const Link = styled.a`
  white-space: nowrap;
`

const FooterCard = styled(Card)({
  position: 'relative',
  zIndex: 1,
})

export function CommentsInspectorFeedbackFooter() {
  return (
    <FooterCard padding={4}>
      <Text muted size={1}>
        Help improve comments.{' '}
        <Link href={FEEDBACK_FORM_LINK} target="_blank" rel="noreferrer">
          <Span>Share your feedback </Span> <LaunchIcon />
        </Link>
      </Text>
    </FooterCard>
  )
}

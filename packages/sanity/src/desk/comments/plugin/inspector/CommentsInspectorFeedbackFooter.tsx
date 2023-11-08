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

  '&:after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    top: -1,
    right: 0,
    borderBottom: '1px solid var(--card-border-color)',
    opacity: 0.5,
  },
})

export function CommentsInspectorFeedbackFooter() {
  return (
    <FooterCard padding={3}>
      <Text muted size={0}>
        Help us improve the commenting experience.{' '}
        <Link href={FEEDBACK_FORM_LINK} target="_blank" rel="noreferrer">
          <Span>Share your feedback </Span> <LaunchIcon />
        </Link>
      </Text>
    </FooterCard>
  )
}

import React from 'react'
import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {CommentInlineHighlightSpan} from '../components'

// [data-inline-comment-state='added'] - The comment has been added
// [data-inline-comment-state='authoring'] - The comment is being authored
// [data-inline-comment-nested='true'] - The comment is a nested comment
// [data-hovered='true'] - The comment is hovered

function Content() {
  return (
    <Stack space={4}>
      <Text size={1}>
        Highlight style{' '}
        <CommentInlineHighlightSpan data-inline-comment-state="authoring">
          when authoring a comment.
        </CommentInlineHighlightSpan>{' '}
      </Text>

      <Text size={1}>
        Highlight style{' '}
        <CommentInlineHighlightSpan
          data-inline-comment-state="added"
          data-inline-comment-nested="false"
        >
          when a comment has been added
        </CommentInlineHighlightSpan>
        .
      </Text>

      <Text size={1}>
        Highlight style{' '}
        <CommentInlineHighlightSpan
          data-inline-comment-state="added"
          data-inline-comment-nested="false"
        >
          when a comment{' '}
        </CommentInlineHighlightSpan>{' '}
        <CommentInlineHighlightSpan
          data-inline-comment-state="added"
          data-inline-comment-nested="true"
        >
          is nested
        </CommentInlineHighlightSpan>
        <CommentInlineHighlightSpan
          data-inline-comment-state="added"
          data-inline-comment-nested="false"
        >
          {' '}
          within another comment
        </CommentInlineHighlightSpan>
      </Text>

      <Text size={1}>
        <CommentInlineHighlightSpan
          data-hovered="true"
          data-inline-comment-state="added"
          data-inline-comment-nested="false"
        >
          Highlight style when hovered or active
        </CommentInlineHighlightSpan>
      </Text>
    </Stack>
  )
}

export default function CommentInlineHighlightSpanStory() {
  return (
    <Flex align="center" height="fill">
      <Container width={1}>
        <Stack space={3}>
          <Card shadow={1} radius={2} padding={5} scheme="light">
            <Content />
          </Card>

          <Card shadow={1} radius={2} padding={5} scheme="dark">
            <Content />
          </Card>
        </Stack>
      </Container>
    </Flex>
  )
}

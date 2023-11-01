import {Flex, Container, Stack, Spinner, Text} from '@sanity/ui'
import React from 'react'
import {CommentStatus} from '../../types'

interface EmptyStateMessage {
  title: string
  message: React.ReactNode
}

export const EMPTY_STATE_MESSAGES: Record<CommentStatus, EmptyStateMessage> = {
  open: {
    title: 'No open comments yet',
    message: (
      <span>
        Open comments on this document <br />
        will be shown here.
      </span>
    ),
  },
  resolved: {
    title: 'No resolved comments yet',
    message: (
      <>
        Resolved comments on this document <br />
        will be shown here.
      </>
    ),
  },
}

interface CommentsListStatusProps {
  error: Error | null
  hasNoComments: boolean
  loading: boolean
  status: CommentStatus
}

/**
 * @beta
 * @hidden
 */
export function CommentsListStatus(props: CommentsListStatusProps) {
  const {status, error, loading, hasNoComments} = props

  if (error) {
    return (
      <Flex align="center" justify="center" flex={1} padding={4}>
        <Flex align="center">
          <Text size={1} muted>
            Something went wrong
          </Text>
        </Flex>
      </Flex>
    )
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" flex={1} padding={4}>
        <Flex align="center" gap={2}>
          <Spinner muted size={1} />

          <Text size={1} muted>
            Loading comments...
          </Text>
        </Flex>
      </Flex>
    )
  }

  if (hasNoComments) {
    return (
      <Flex align="center" justify="center" flex={1} sizing="border">
        <Container width={0} padding={4}>
          <Stack space={3}>
            <Text align="center" size={1} muted weight="semibold">
              {EMPTY_STATE_MESSAGES[status].title}
            </Text>

            <Text align="center" size={1} muted>
              {EMPTY_STATE_MESSAGES[status].message}
            </Text>
          </Stack>
        </Container>
      </Flex>
    )
  }

  return null
}

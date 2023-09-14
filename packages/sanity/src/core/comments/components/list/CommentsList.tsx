/* eslint-disable max-nested-callbacks */
import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useState} from 'react'
import {BoundaryElementProvider, Container, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {CurrentUser, Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {CommentCreatePayload, CommentDocument, CommentEditPayload, CommentStatus} from '../../types'
import {MentionOptionsHookValue} from '../../hooks'
import {CommentsListItem} from './CommentsListItem'
import {CommentThreadLayout} from './CommentThreadLayout'
import {EMPTY_STATE_MESSAGES} from './constants'

interface GroupedComments {
  [field: string]: CommentDocument[]
}

function groupComments(comments: CommentDocument[]) {
  return comments.reduce((acc, comment) => {
    const field = comment.target?.path?.field

    if (!acc[field]) {
      acc[field] = []
    }

    acc[field].push(comment)

    return acc
  }, {} as GroupedComments)
}

/**
 * @beta
 * @hidden
 */
export interface CommentsListProps {
  comments: CommentDocument[]
  currentUser: CurrentUser
  error: Error | null
  loading: boolean
  mentionOptions: MentionOptionsHookValue
  onDelete: (id: string) => void
  onEdit: (id: string, payload: CommentEditPayload) => void
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  onPathFocus?: (path: Path) => void
  onReply: (payload: CommentCreatePayload) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  status: CommentStatus
}

/**
 * @beta
 * @hidden
 */
export interface CommentsListHandle {
  scrollToComment: (id: string) => void
}

/**
 * @beta
 * @hidden
 */
export const CommentsList = forwardRef<CommentsListHandle, CommentsListProps>(function CommentsList(
  props: CommentsListProps,
  ref,
) {
  const {
    comments,
    currentUser,
    error,
    loading,
    mentionOptions,
    onDelete,
    onEdit,
    onNewThreadCreate,
    onPathFocus,
    onReply,
    onStatusChange,
    status,
  } = props
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

  const scrollToComment = useCallback(
    (id: string) => {
      const commentElement = boundaryElement?.querySelector(`[data-comment-id="${id}"]`)

      commentElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    },
    [boundaryElement],
  )

  useImperativeHandle(
    ref,
    () => {
      return {
        scrollToComment,
      }
    },
    [scrollToComment],
  )

  const groupedComments = useMemo(() => {
    // This is done to make sure we get all replies, even if they are not in
    // the current view (ie has wrong status)
    const filteredComments = comments
      // 1. Get all comments that are not replies and are in the current view (open or resolved)
      .filter((c) => c.status === status && !c.parentCommentId)
      // 2. Get all replies to each parent comment and add them to the array
      .map((c) => {
        return [c, ...comments.filter((c2) => c2.parentCommentId === c._id)]
      })
      .flat()

    return Object.entries(groupComments(filteredComments))
  }, [comments, status])

  const showComments = !loading && !error && groupedComments.length > 0
  const showEmptyState = !loading && !error && groupedComments.length === 0
  const showError = error
  const showLoading = loading && !error

  return (
    <Flex
      direction="column"
      flex={1}
      height="fill"
      overflow="hidden"
      ref={setBoundaryElement}
      sizing="border"
    >
      {showEmptyState && (
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
      )}

      {showLoading && (
        <Flex align="center" justify="center" flex={1} padding={4}>
          <Flex align="center" gap={2}>
            <Spinner muted size={1} />
            <Text size={1} muted>
              Loading comments...
            </Text>
          </Flex>
        </Flex>
      )}

      {showError && (
        <Flex align="center" justify="center" flex={1} padding={4}>
          <Flex align="center">
            <Text size={1} muted>
              Something went wrong
            </Text>
          </Flex>
        </Flex>
      )}

      {showComments && (
        <Stack
          flex={1}
          overflow="auto"
          paddingBottom={6}
          paddingX={3}
          paddingY={4}
          sizing="border"
          space={4}
        >
          <BoundaryElementProvider element={boundaryElement}>
            {groupedComments.map(([fieldPath, group]) => {
              const parentComments = group.filter((c) => !c.parentCommentId)

              return (
                <CommentThreadLayout
                  currentUser={currentUser}
                  key={fieldPath}
                  mentionOptions={mentionOptions}
                  onNewThreadCreate={onNewThreadCreate}
                  path={PathUtils.fromString(fieldPath)}
                >
                  {parentComments.map((comment) => {
                    const replies = group.filter((c) => c.parentCommentId === comment._id)

                    // The default sort order is by date, descending (newest first).
                    // However, inside a thread, we want the order to be ascending (oldest first).
                    // So we reverse the array here.
                    const orderedReplies = [...replies].reverse()

                    return (
                      <CommentsListItem
                        currentUser={currentUser}
                        key={comment?._id}
                        mentionOptions={mentionOptions}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onPathFocus={onPathFocus}
                        onReply={onReply}
                        onStatusChange={onStatusChange}
                        parentComment={comment}
                        replies={orderedReplies}
                      />
                    )
                  })}
                </CommentThreadLayout>
              )
            })}
          </BoundaryElementProvider>
        </Stack>
      )}
    </Flex>
  )
})

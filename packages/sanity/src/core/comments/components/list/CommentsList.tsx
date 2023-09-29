import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useState} from 'react'
import {BoundaryElementProvider, Container, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {CurrentUser, Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {
  CommentCreatePayload,
  CommentEditPayload,
  CommentStatus,
  CommentThreadItem,
} from '../../types'
import {MentionOptionsHookValue} from '../../hooks'
import {CommentsListItem} from './CommentsListItem'
import {CommentThreadLayout} from './CommentThreadLayout'
import {EMPTY_STATE_MESSAGES} from './constants'

const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
}

interface GroupedComments {
  [field: string]: CommentThreadItem[]
}

function groupThreads(comments: CommentThreadItem[]) {
  return comments.reduce((acc, comment) => {
    const field = comment.fieldPath

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
  comments: CommentThreadItem[]
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
      commentElement?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
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

  const showComments = !loading && !error && comments.length > 0
  const showEmptyState = !loading && !error && comments.length === 0
  const showError = error
  const showLoading = loading && !error

  // We group the threads so that they can be rendered together under the
  // same breadcrumbs. This is to avoid having the same breadcrumbs repeated
  // for every single comment thread. Also, we don't want to have threads pointing
  // to the same field to be rendered separately in the list since that makes it
  // harder to get an overview of the comments about a specific field.
  const groupedThreads = useMemo(() => Object.entries(groupThreads(comments)), [comments])

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
          as="ul"
          flex={1}
          overflow="auto"
          padding={3}
          paddingBottom={6}
          sizing="border"
          space={4}
        >
          <BoundaryElementProvider element={boundaryElement}>
            {groupedThreads?.map(([fieldPath, group]) => {
              // Since all threads in the group point to the same field, the breadcrumbs will be
              // the same for all of them. Therefore, we can just pick the first one.
              const breadcrumbs = group[0].breadcrumbs

              // The thread ID is used to scroll to the thread.
              // We pick the first thread id in the group so that we scroll to the first thread
              // in the group.
              const firstThreadId = group[0].threadId

              return (
                <Stack as="li" key={fieldPath} data-thread-id={firstThreadId}>
                  <CommentThreadLayout
                    breadcrumbs={breadcrumbs}
                    canCreateNewThread={status === 'open'}
                    currentUser={currentUser}
                    key={fieldPath}
                    mentionOptions={mentionOptions}
                    onNewThreadCreate={onNewThreadCreate}
                    path={PathUtils.fromString(fieldPath)}
                  >
                    {group.map((item) => {
                      // The default sort order is by date, descending (newest first).
                      // However, inside a thread, we want the order to be ascending (oldest first).
                      // So we reverse the array here.
                      // We use slice() to avoid mutating the original array.
                      const replies = item.replies.slice().reverse()

                      return (
                        <CommentsListItem
                          canReply={status === 'open'}
                          currentUser={currentUser}
                          key={item.parentComment._id}
                          mentionOptions={mentionOptions}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          onPathFocus={onPathFocus}
                          onReply={onReply}
                          onStatusChange={onStatusChange}
                          parentComment={item.parentComment}
                          replies={replies}
                        />
                      )
                    })}
                  </CommentThreadLayout>
                </Stack>
              )
            })}
          </BoundaryElementProvider>
        </Stack>
      )}
    </Flex>
  )
})

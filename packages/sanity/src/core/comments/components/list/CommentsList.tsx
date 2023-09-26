import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useState} from 'react'
import {BoundaryElementProvider, Container, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {CurrentUser, Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {
  CommentBreadcrumbs,
  CommentCreatePayload,
  CommentDocument,
  CommentEditPayload,
  CommentStatus,
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

function getReplies(parentCommentId: string, group: CommentDocument[]) {
  const replies = group.filter((c) => c.parentCommentId === parentCommentId)

  // The default sort order is by date, descending (newest first).
  // However, inside a thread, we want the order to be ascending (oldest first).
  // So we reverse the array here.
  const orderedReplies = [...replies].reverse()

  return orderedReplies
}

/**
 * @beta
 * @hidden
 */
export interface CommentsListProps {
  buildCommentBreadcrumbs?: (fieldPath: string) => CommentBreadcrumbs
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
    buildCommentBreadcrumbs,
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

  const groupedComments = useMemo(() => {
    const filteredComments = comments
      // 1. Get all comments that are not replies and are in the current view (open or resolved)
      .filter((c) => !c.parentCommentId)
      // 2. Get all replies to each parent comment and add them to the array
      // eslint-disable-next-line max-nested-callbacks
      .map((c) => [c, ...comments.filter((c2) => c2.parentCommentId === c._id)])
      .flat()

    return Object.entries(groupComments(filteredComments))
  }, [comments])

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
          as="ul"
          flex={1}
          overflow="auto"
          padding={3}
          paddingBottom={6}
          sizing="border"
          space={4}
        >
          <BoundaryElementProvider element={boundaryElement}>
            {groupedComments.map(([fieldPath, group]) => {
              const parentComments = group.filter((c) => !c.parentCommentId)

              // The threadId is used to identify the thread in the DOM, so we can scroll to it.
              // todo: validate this approach
              const threadId = group[0].threadId

              const breadcrumbs = buildCommentBreadcrumbs?.(fieldPath)
              const hasInvalidField = breadcrumbs?.some((b) => b.invalid === true)

              // If the breadcrumb is invalid, the field might have been remove from the
              // the schema, or an array item might have been removed. In that case, we don't
              // want to render any button to open the field.
              const _onPathFocus = hasInvalidField ? undefined : onPathFocus

              return (
                <Stack as="li" data-thread-id={threadId} key={fieldPath}>
                  <CommentThreadLayout
                    breadcrumbs={breadcrumbs}
                    canCreateNewThread={status === 'open'}
                    currentUser={currentUser}
                    hasInvalidField={hasInvalidField}
                    key={fieldPath}
                    mentionOptions={mentionOptions}
                    onNewThreadCreate={onNewThreadCreate}
                    path={PathUtils.fromString(fieldPath)}
                  >
                    {parentComments.map((comment) => {
                      const replies = getReplies(comment._id, group)

                      return (
                        <CommentsListItem
                          canReply={status === 'open' && !hasInvalidField}
                          currentUser={currentUser}
                          key={comment?._id}
                          mentionOptions={mentionOptions}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          onPathFocus={_onPathFocus}
                          onReply={onReply}
                          onStatusChange={onStatusChange}
                          parentComment={comment}
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

import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useState} from 'react'
import {BoundaryElementProvider, Flex, Stack} from '@sanity/ui'
import {CurrentUser, Path} from '@sanity/types'
import {
  CommentCreatePayload,
  CommentEditPayload,
  CommentStatus,
  CommentThreadItem,
  MentionOptionsHookValue,
} from '../../types'
import {SelectedPath} from '../../context/comments/types'
import {CommentsListItem} from './CommentsListItem'
import {CommentThreadLayout} from './CommentThreadLayout'
import {CommentsListStatus} from './CommentsListStatus'

const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'start',
  inline: 'nearest',
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
  onCopyLink?: (id: string) => void
  onCreateRetry: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, payload: CommentEditPayload) => void
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  onPathSelect?: (path: Path) => void
  onReply: (payload: CommentCreatePayload) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  selectedPath: SelectedPath
  status: CommentStatus
}

/**
 * @beta
 * @hidden
 */
export interface CommentsListHandle {
  scrollToComment: (id: string) => void
}

const CommentsListInner = forwardRef<CommentsListHandle, CommentsListProps>(
  function CommentsListInner(props: CommentsListProps, ref) {
    const {
      comments,
      currentUser,
      error,
      loading,
      mentionOptions,
      onCopyLink,
      onCreateRetry,
      onDelete,
      onEdit,
      onNewThreadCreate,
      onPathSelect,
      onReply,
      onStatusChange,
      selectedPath,
      status,
    } = props
    const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

    const scrollToComment = useCallback((id: string) => {
      const commentElement = document?.querySelector(`[data-comment-id="${id}"]`)

      if (commentElement) {
        commentElement.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
      }
    }, [])

    useImperativeHandle(
      ref,
      () => {
        return {
          scrollToComment,
        }
      },
      [scrollToComment],
    )

    const groupedThreads = useMemo(() => Object.entries(groupThreads(comments)), [comments])

    const showComments = !loading && !error && groupedThreads.length > 0

    return (
      <Flex
        direction="column"
        flex={1}
        height="fill"
        overflow="hidden"
        ref={setBoundaryElement}
        sizing="border"
      >
        <CommentsListStatus
          error={error}
          hasNoComments={groupedThreads.length === 0}
          loading={loading}
          status={status}
        />

        {showComments && (
          <Stack
            as="ul"
            flex={1}
            overflow="auto"
            padding={3}
            paddingTop={1}
            paddingBottom={6}
            sizing="border"
            space={1}
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
                  <Stack as="li" key={fieldPath} data-thread-id={firstThreadId} paddingTop={3}>
                    <CommentThreadLayout
                      breadcrumbs={breadcrumbs}
                      canCreateNewThread={status === 'open'}
                      currentUser={currentUser}
                      fieldPath={fieldPath}
                      key={fieldPath}
                      mentionOptions={mentionOptions}
                      onNewThreadCreate={onNewThreadCreate}
                    >
                      {group.map((item) => {
                        // The default sort order is by date, descending (newest first).
                        // However, inside a thread, we want the order to be ascending (oldest first).
                        // So we reverse the array here.
                        // We use slice() to avoid mutating the original array.
                        const replies = item.replies.slice().reverse()

                        const canReply =
                          status === 'open' &&
                          item.parentComment._state?.type !== 'createError' &&
                          item.parentComment._state?.type !== 'createRetrying'

                        // Check if the current field is selected
                        const isSelected = selectedPath?.fieldPath === item.fieldPath

                        return (
                          <CommentsListItem
                            canReply={canReply}
                            currentUser={currentUser}
                            key={item.parentComment._id}
                            mentionOptions={mentionOptions}
                            onCopyLink={onCopyLink}
                            onCreateRetry={onCreateRetry}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onPathSelect={onPathSelect}
                            onReply={onReply}
                            onStatusChange={onStatusChange}
                            parentComment={item.parentComment}
                            replies={replies}
                            selected={isSelected}
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
  },
)

/**
 * @beta
 * @hidden
 */
export const CommentsList = React.memo(CommentsListInner)

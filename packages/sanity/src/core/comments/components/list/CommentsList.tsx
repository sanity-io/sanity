import {type CurrentUser} from '@sanity/types'
import {BoundaryElementProvider, Flex, Stack} from '@sanity/ui'
import {forwardRef, memo, useMemo, useState} from 'react'

import {type UserListWithPermissionsHookValue} from '../../../hooks'
import {type CommentsSelectedPath} from '../../context'
import {applyCommentsGroupAttr} from '../../hooks'
import {
  type CommentBaseCreatePayload,
  type CommentReactionOption,
  type CommentStatus,
  type CommentsUIMode,
  type CommentThreadItem,
  type CommentUpdatePayload,
} from '../../types'
import {CommentsListItem} from './CommentsListItem'
import {CommentsListStatus} from './CommentsListStatus'
import {CommentThreadLayout} from './CommentThreadLayout'

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
  beforeListNode?: React.ReactNode
  comments: CommentThreadItem[]
  currentUser: CurrentUser
  error: Error | null
  loading: boolean
  mentionOptions: UserListWithPermissionsHookValue
  mode: CommentsUIMode
  onCopyLink?: (id: string) => void
  onCreateRetry: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, payload: CommentUpdatePayload) => void
  onNewThreadCreate: (payload: CommentBaseCreatePayload) => void
  /**
   * @internal
   */
  onPathSelect?: (nextPath: CommentsSelectedPath) => void
  onReactionSelect?: (id: string, reaction: CommentReactionOption) => void
  onReply: (payload: CommentBaseCreatePayload) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  readOnly?: boolean
  /**
   * @internal
   */
  selectedPath: CommentsSelectedPath | null
  status: CommentStatus
}

/**
 * @beta
 * @hidden
 */
export interface CommentsListHandle {
  scrollToComment: (id: string) => void
}

const CommentsListInner = forwardRef(function CommentsListInner(
  props: CommentsListProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const {
    beforeListNode,
    comments,
    currentUser,
    error,
    loading,
    mentionOptions,
    mode,
    onCopyLink,
    onCreateRetry,
    onDelete,
    onEdit,
    onNewThreadCreate,
    onPathSelect,
    onReactionSelect,
    onReply,
    onStatusChange,
    readOnly,
    selectedPath,
    status,
  } = props
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

  const groupedThreads = useMemo(() => Object.entries(groupThreads(comments)), [comments])

  const showComments = !loading && !error && groupedThreads.length > 0

  return (
    <Flex
      data-testid="comments-list"
      direction="column"
      flex={1}
      height="fill"
      overflow="hidden"
      ref={setBoundaryElement}
      sizing="border"
    >
      {mode !== 'upsell' && (
        <CommentsListStatus
          error={error}
          hasNoComments={groupedThreads.length === 0}
          loading={loading}
          status={status}
        />
      )}

      {(showComments || beforeListNode) && (
        <Stack
          as="ul"
          flex={1}
          overflow="auto"
          padding={3}
          paddingTop={1}
          paddingBottom={6}
          sizing="border"
          space={1}
          ref={ref}
        >
          {beforeListNode}

          <BoundaryElementProvider element={boundaryElement}>
            {groupedThreads?.map(([fieldPath, group]) => {
              // Since all threads in the group point to the same field, the breadcrumbs will be
              // the same for all of them. Therefore, we can just pick the first one.
              const breadcrumbs = group[0].breadcrumbs

              // The thread ID is used to scroll to the thread.
              // We pick the first thread id in the group so that we scroll to the first thread
              // in the group.
              const firstThreadId = group[0].threadId

              // The new thread is selected if the field path matches the selected path and
              // there is no thread ID selected.
              const newThreadSelected =
                selectedPath?.fieldPath === fieldPath && !selectedPath.threadId

              return (
                <Stack
                  key={fieldPath}
                  as="li"
                  paddingTop={3}
                  {...applyCommentsGroupAttr(firstThreadId)}
                >
                  <CommentThreadLayout
                    key={fieldPath}
                    breadcrumbs={breadcrumbs}
                    canCreateNewThread={status === 'open'}
                    currentUser={currentUser}
                    fieldPath={fieldPath}
                    isSelected={newThreadSelected}
                    mentionOptions={mentionOptions}
                    mode={mode}
                    onNewThreadCreate={onNewThreadCreate}
                    onPathSelect={onPathSelect}
                    readOnly={readOnly}
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

                      // The thread is selected if the thread ID and field path matches the
                      // selected path.
                      const threadIsSelected =
                        selectedPath?.threadId === item.parentComment.threadId &&
                        selectedPath?.fieldPath === item.parentComment.target.path?.field

                      return (
                        <CommentsListItem
                          key={item.parentComment._id}
                          canReply={canReply}
                          currentUser={currentUser}
                          hasReferencedValue={item.hasReferencedValue}
                          isSelected={threadIsSelected}
                          mentionOptions={mentionOptions}
                          mode={mode}
                          onCopyLink={onCopyLink}
                          onCreateRetry={onCreateRetry}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          onPathSelect={onPathSelect}
                          onReactionSelect={onReactionSelect}
                          onReply={onReply}
                          onStatusChange={onStatusChange}
                          parentComment={item.parentComment}
                          readOnly={readOnly}
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

/**
 * @beta
 * @hidden
 */
export const CommentsList = memo(CommentsListInner)

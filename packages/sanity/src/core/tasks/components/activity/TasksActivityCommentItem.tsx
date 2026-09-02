import {type CurrentUser} from '@sanity/types'
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {CommentsListItem as CommentsListItemV2} from '../../../comments-v2/components/list/CommentsListItem'
import {useComments as useCommentsV2} from '../../../comments-v2/hooks/useComments'
import {CommentsListItem} from '../../../comments/components/list/CommentsListItem'
import {useComments} from '../../../comments/hooks/useComments'
import {type UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'
import {useWorkspace} from '../../../studio/workspace'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'
import {ActivityItem} from './TasksActivityItem'
import {type TaskCommentReply} from './types'

const COMMENTS_LIST_ITEM_AVATAR_CONFIG = {
  parentCommentAvatar: false,
  threadCommentsAvatar: true,
  replyAvatar: true,
  avatarSize: 0,
} as const

interface TasksActivityCommentItemProps {
  /**
   * The id of the comment that starts the thread. The thread itself is read
   * from the comments implementation the task is using.
   */
  commentId: string
  currentUser: CurrentUser
  mentionOptions: UserListWithPermissionsHookValue
  onCreateRetry: (id: string) => void
  onDelete: (id: string) => void
  onReply: (reply: TaskCommentReply) => void
}

const CommentListItemRoot = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    [data-ui='CommentsListItem'] {
      padding-right: ${theme.space[2]}px;
    }

    // Increase the padding when the comment input is focused
    [data-ui='CommentInputEditableWrap']:focus-within {
      padding-bottom: ${theme.space[2]}px;
    }
  `
})

/**
 * Comment thread in the activity log. Picks v1 or v2 from `beta.comments.v2`.
 */
export function TasksActivityCommentItem(props: TasksActivityCommentItemProps) {
  const {beta} = useWorkspace()

  if (beta?.comments?.v2) {
    return <TasksActivityCommentItemV2 {...props} />
  }

  return <TasksActivityCommentItemV1 {...props} />
}

/**
 * Comment thread wired to the v1 comments context.
 */
function TasksActivityCommentItemV1(props: TasksActivityCommentItemProps) {
  const {commentId, currentUser, mentionOptions, onCreateRetry, onDelete, onReply} = props
  const {mode} = useTasksEnabled()
  const {comments, operation} = useComments()

  const thread = comments.data.open.find((item) => item.parentComment._id === commentId)

  if (!thread) return null

  return (
    <ActivityItem userId={thread.parentComment.authorId} avatarPaddingTop={3}>
      <CommentListItemRoot>
        <CommentsListItem
          avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
          canReply
          currentUser={currentUser}
          isSelected={false}
          mentionOptions={mentionOptions}
          mode={mode ?? 'default'}
          onCreateRetry={onCreateRetry}
          onDelete={onDelete}
          onEdit={operation.update}
          onReactionSelect={operation.react}
          onReply={onReply}
          parentComment={thread.parentComment}
          replies={thread.replies}
        />
      </CommentListItemRoot>
    </ActivityItem>
  )
}

/**
 * Comment thread wired to the v2 comments context.
 */
function TasksActivityCommentItemV2(props: TasksActivityCommentItemProps) {
  const {commentId, currentUser, mentionOptions, onCreateRetry, onDelete, onReply} = props
  const {mode} = useTasksEnabled()
  const {comments, operation} = useCommentsV2()

  const thread = comments.data.open.find((item) => item.parentComment._id === commentId)

  if (!thread) return null

  return (
    <ActivityItem userId={thread.parentComment._system.createdBy} avatarPaddingTop={3}>
      <CommentListItemRoot>
        <CommentsListItemV2
          avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
          canReply
          currentUser={currentUser}
          isSelected={false}
          mentionOptions={mentionOptions}
          mode={mode ?? 'default'}
          onCreateRetry={onCreateRetry}
          onDelete={onDelete}
          onEdit={operation.update}
          onReactionSelect={operation.react}
          onReply={onReply}
          parentComment={thread.parentComment}
          replies={thread.replies}
        />
      </CommentListItemRoot>
    </ActivityItem>
  )
}

import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {CommentsListItem, type CommentsListItemProps} from '../../../comments/components'
import {useTasksEnabled} from '../../context'
import {ActivityItem} from './TasksActivityItem'

const COMMENTS_LIST_ITEM_AVATAR_CONFIG: CommentsListItemProps['avatarConfig'] = {
  parentCommentAvatar: false,
  threadCommentsAvatar: true,
  replyAvatar: true,
  avatarSize: 0,
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TasksActivityCommentItemProps extends Omit<CommentsListItemProps, 'mode' | 'isSelected'> {
  // ...
}

const CommentListItemRoot = styled.div`
  [data-ui='CommentsListItem'] {
    padding-right: ${vars.space[2]};
  }

  // Increase the padding when the comment input is focused
  [data-ui='CommentInputEditableWrap']:focus-within {
    padding-bottom: ${vars.space[2]};
  }
`

export function TasksActivityCommentItem(props: TasksActivityCommentItemProps) {
  const {parentComment} = props
  const {mode} = useTasksEnabled()

  return (
    <ActivityItem userId={parentComment.authorId} avatarPaddingTop={3}>
      <CommentListItemRoot>
        <CommentsListItem
          {...props}
          avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
          canReply
          isSelected={false}
          mode={mode ?? 'default'}
        />
      </CommentListItemRoot>
    </ActivityItem>
  )
}

import {CommentsListItem, type CommentsListItemProps} from '../../../structure/comments'
import {ActivityItem} from './TasksActivityItem'

const COMMENTS_LIST_ITEM_AVATAR_CONFIG: CommentsListItemProps['avatarConfig'] = {
  parentCommentAvatar: false,
  threadCommentsAvatar: true,
  replyAvatar: true,
  avatarSize: 0,
}

interface TasksActivityCommentItemProps extends Omit<CommentsListItemProps, 'mode' | 'isSelected'> {
  // ...
}

export function TasksActivityCommentItem(props: TasksActivityCommentItemProps) {
  const {parentComment} = props

  return (
    <ActivityItem userId={parentComment.authorId}>
      <CommentsListItem
        {...props}
        avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
        canReply
        innerPadding={1}
        isSelected={false}
        mode="default" // TODO: set dynamic mode?
      />
    </ActivityItem>
  )
}

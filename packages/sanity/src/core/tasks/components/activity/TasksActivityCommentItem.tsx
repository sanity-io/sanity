import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {
  CommentsListItem,
  type CommentsListItemProps,
} from '../../../comments/components/list/CommentsListItem'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'
import {commentListItemRoot, space2Var} from './TasksActivityCommentItem.css'
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
  const {mode} = useTasksEnabled()
  const {space} = useThemeV2()

  return (
    <ActivityItem userId={parentComment.authorId} avatarPaddingTop={3}>
      <div className={commentListItemRoot} style={assignInlineVars({[space2Var]: `${space[2]}px`})}>
        <CommentsListItem
          {...props}
          avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
          canReply
          isSelected={false}
          mode={mode ?? 'default'}
        />
      </div>
    </ActivityItem>
  )
}

import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {CommentsListItem, type CommentsListItemProps} from '../../../comments/components'
import {useTasksEnabled} from '../../context'
import * as classes from './TasksActivityCommentItem.css'
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

export function TasksActivityCommentItem(props: TasksActivityCommentItemProps) {
  const {parentComment} = props
  const {mode} = useTasksEnabled()
  const theme = useThemeV2()

  return (
    <ActivityItem userId={parentComment.authorId} avatarPaddingTop={3}>
      <div
        className={classes.commentListItemRoot}
        style={assignInlineVars({
          [classes.paddingRightVar]: `${theme.space[2]}px`,
          [classes.paddingBottomVar]: `${theme.space[2]}px`,
        })}
      >
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

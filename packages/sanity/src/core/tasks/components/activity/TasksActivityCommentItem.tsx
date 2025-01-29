// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {CommentsListItem, type CommentsListItemProps} from '../../../comments/components'
import {useTasksEnabled} from '../../context'
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

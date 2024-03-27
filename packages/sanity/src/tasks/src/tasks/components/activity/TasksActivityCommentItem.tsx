// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import styled, {css} from 'styled-components'

import {CommentsListItem, type CommentsListItemProps} from '../../../../../structure/comments'
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
    [data-ui='comments-list-item'] {
      padding-right: ${theme.space[2]}px;
      &:focus-within {
        padding-bottom: ${theme.space[2]}px;
      }
    }
  `
})
export function TasksActivityCommentItem(props: TasksActivityCommentItemProps) {
  const {parentComment} = props

  return (
    <ActivityItem userId={parentComment.authorId}>
      <CommentListItemRoot>
        <CommentsListItem
          {...props}
          avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
          canReply
          isSelected={false}
          mode="default"
        />
      </CommentListItemRoot>
    </ActivityItem>
  )
}

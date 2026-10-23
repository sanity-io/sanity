import {css} from '#styled-system/css'

/** `${space[2]}px` */
export const space2Var = '--tasks-activity-comment-item-space-2'

export const commentListItemRoot = css({
  "& [data-ui='CommentsListItem']": {
    paddingRight: `var(${space2Var})`,
  },
  // Increase the padding when the comment input is focused
  "& [data-ui='CommentInputEditableWrap']:focus-within": {
    paddingBottom: `var(${space2Var})`,
  },
})

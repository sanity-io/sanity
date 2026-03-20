import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const paddingRightVar = createVar()
export const paddingBottomVar = createVar()

export const commentListItemRoot = style({})

globalStyle(`${commentListItemRoot} [data-ui='CommentsListItem']`, {
  paddingRight: paddingRightVar,
})

// Increase the padding when the comment input is focused
globalStyle(`${commentListItemRoot} [data-ui='CommentInputEditableWrap']:focus-within`, {
  paddingBottom: paddingBottomVar,
})

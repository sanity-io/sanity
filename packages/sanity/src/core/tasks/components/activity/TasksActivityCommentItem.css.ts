import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `${space[2]}px` */
export const space2Var = createVar()

export const commentListItemRoot = style({})

globalStyle(`${commentListItemRoot} [data-ui='CommentsListItem']`, {
  paddingRight: space2Var,
})

// Increase the padding when the comment input is focused
globalStyle(`${commentListItemRoot} [data-ui='CommentInputEditableWrap']:focus-within`, {
  paddingBottom: space2Var,
})

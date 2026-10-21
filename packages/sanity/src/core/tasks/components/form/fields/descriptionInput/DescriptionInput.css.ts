import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `${space[1]}px 0px` in edit mode, `${space[3]}px ${space[2]}px` otherwise */
export const editableWrapPaddingVar = createVar()
/** `${Math.max($minHeight + verticalPadding, minHeight)}px` */
export const editableWrapMinHeightVar = createVar()

export const descriptionInputRoot = style({})

/** Added next to `descriptionInputRoot` when `mode === 'edit'` */
export const descriptionInputRootEdit = style({})

/* select CommentInputEditableWrap and change the padding */
globalStyle(`${descriptionInputRoot} [data-ui='CommentInputEditableWrap']`, {
  overflow: 'hidden',
  padding: editableWrapPaddingVar,
  minHeight: `${editableWrapMinHeightVar} !important`,
})

globalStyle(`${descriptionInputRootEdit} #comment-input-root`, {
  boxShadow: 'none',
})

globalStyle(`${descriptionInputRoot} [data-ui='CommentInputActions']`, {
  display: 'none !important',
})

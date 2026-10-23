import {css} from '#styled-system/css'

/** `${space[1]}px 0px` in edit mode, `${space[3]}px ${space[2]}px` otherwise */
export const editableWrapPaddingVar = '--description-input-editable-wrap-padding'
/** `${Math.max($minHeight + verticalPadding, minHeight)}px` */
export const editableWrapMinHeightVar = '--description-input-editable-wrap-min-height'

export const descriptionInputRoot = css({
  /* select CommentInputEditableWrap and change the padding */
  "& [data-ui='CommentInputEditableWrap']": {
    overflow: 'hidden',
    padding: `var(${editableWrapPaddingVar})`,
  },
  // `&&&&` (0,5,0) outranks the (0,3,0)/(0,4,0) `min-height` rules CommentInputInner puts on the
  // same element
  "&&&& [data-ui='CommentInputEditableWrap']": {
    minHeight: `var(${editableWrapMinHeightVar})`,
  },
  // `&&&&` (0,5,0) outranks the (0,4,0) rule that shows CommentInputInner's actions on focus
  "&&&& [data-ui='CommentInputActions']": {
    display: 'none',
  },
})

/** Added next to `descriptionInputRoot` when `mode === 'edit'` */
export const descriptionInputRootEdit = css({
  '& #comment-input-root': {
    boxShadow: 'none',
  },
})

import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const paddingVar = createVar()
export const minHeightVar = createVar()
export const boxShadowVar = createVar()

export const descriptionInputRoot = style({})

globalStyle(`${descriptionInputRoot} [data-ui='CommentInputEditableWrap']`, {
  overflow: 'hidden',
  padding: paddingVar,
  minHeight: minHeightVar,
})

globalStyle(`${descriptionInputRoot} #comment-input-root`, {
  boxShadow: boxShadowVar,
})

globalStyle(`${descriptionInputRoot} [data-ui='CommentInputActions']`, {
  display: 'none !important',
})

import {createVar, style} from '@vanilla-extract/css'

export const paddingInlineVar = createVar()
export const paddingBlockStartVar = createVar()
export const paddingBlockEndVar = createVar()
export const maxWidthVar = createVar()

export const formContainer = style({
  boxSizing: 'border-box',
  marginInline: 'auto',
  paddingInline: paddingInlineVar,
  paddingBlockStart: paddingBlockStartVar,
  paddingBlockEnd: paddingBlockEndVar,
  maxWidth: maxWidthVar,
})

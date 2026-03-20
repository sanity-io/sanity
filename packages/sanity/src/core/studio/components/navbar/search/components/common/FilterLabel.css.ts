import {createVar, style} from '@vanilla-extract/css'

export const flexShrinkVar = createVar()

export const customBox = style({
  flexShrink: flexShrinkVar,
})

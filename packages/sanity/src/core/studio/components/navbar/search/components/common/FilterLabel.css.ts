import {createVar, style} from '@vanilla-extract/css'

export const flexShrinkVar = createVar()

export const filterLabelBox = style({
  flexShrink: flexShrinkVar,
})

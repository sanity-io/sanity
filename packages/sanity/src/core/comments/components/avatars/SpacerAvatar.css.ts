import {createVar, style} from '@vanilla-extract/css'

export const minWidthVar = createVar()

export const spacerAvatar = style({
  minWidth: minWidthVar,
})

import {createVar, style} from '@vanilla-extract/css'

export const marginVar = createVar()

export const avatarStackBox = style({
  margin: marginVar,
})

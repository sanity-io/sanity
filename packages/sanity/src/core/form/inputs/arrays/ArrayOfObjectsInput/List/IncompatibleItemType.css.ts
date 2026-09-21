import {createVar, style} from '@vanilla-extract/css'

export const container1Var = createVar()

export const popoverCard = style({
  maxWidth: container1Var,
})

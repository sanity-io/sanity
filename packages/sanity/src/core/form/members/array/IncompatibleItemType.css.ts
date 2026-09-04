import {createVar, style} from '@vanilla-extract/css'

/** Theme `container[1]`, set with `assignInlineVars` by `IncompatibleItemType`. */
export const container1Var = createVar()

export const popoverCard = style({
  maxWidth: container1Var,
})

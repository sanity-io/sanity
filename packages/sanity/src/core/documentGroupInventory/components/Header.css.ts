import {createVar, style} from '@vanilla-extract/css'

/** `${space[4]}px` */
export const space4Var = createVar()
/** `${space[5]}px` */
export const space5Var = createVar()

export const header = style({
  minInlineSize: 0,
  paddingInline: space4Var,
  paddingBlockStart: space4Var,
  paddingBlockEnd: `calc(${space5Var} * 0.5)`,
})

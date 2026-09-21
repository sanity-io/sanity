import {createVar, style} from '@vanilla-extract/css'

/** `${space[2]}px` */
export const space2Var = createVar()
/** `${space[3]}px` */
export const space3Var = createVar()

export const firstRow = style({
  columnGap: space2Var,
  rowGap: space3Var,
})

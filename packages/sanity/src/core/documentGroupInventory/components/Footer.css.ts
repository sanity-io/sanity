import {createVar, style} from '@vanilla-extract/css'

/** `${space[3]}px` */
export const space3Var = createVar()
/** `${space[4]}px` */
export const space4Var = createVar()
/** `${space[5]}px` */
export const space5Var = createVar()

export const footer = style({
  display: 'flex',
  paddingInline: space4Var,
  paddingBlockStart: `calc(${space5Var} * 0.5)`,
  paddingBlockEnd: space4Var,
  gap: space3Var,
  justifyContent: 'end',
})

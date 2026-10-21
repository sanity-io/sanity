import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `${space[2]}px` */
export const space2Var = createVar()

export const statusBadge = style({})

globalStyle(`${statusBadge}${statusBadge} span`, {
  display: 'flex',
  alignItems: 'center',
  gap: space2Var,
  wordBreak: 'keep-all',
  whiteSpace: 'nowrap',
})

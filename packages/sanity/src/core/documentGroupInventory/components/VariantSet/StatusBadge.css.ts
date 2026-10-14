import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `${space[2]}px` */
export const space2Var = createVar()

export const statusBadge = style({})

// Badge renders its children through Text, which sets `display: block` on its inner span with
// `& > span` (0,1,1) — the same specificity as `.statusBadge span`. The original only won that
// tie by styled-components injection order, so the ancestor class is doubled here.
globalStyle(`${statusBadge}${statusBadge} span`, {
  display: 'flex',
  alignItems: 'center',
  gap: space2Var,
  wordBreak: 'keep-all',
  whiteSpace: 'nowrap',
})

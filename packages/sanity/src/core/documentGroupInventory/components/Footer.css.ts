import {css} from '#styled-system/css'

/** `${space[3]}px` */
export const space3Var = '--footer-space-3'
/** `${space[4]}px` */
export const space4Var = '--footer-space-4'
/** `${space[5]}px` */
export const space5Var = '--footer-space-5'

export const footer = css({
  display: 'flex',
  paddingInline: `var(${space4Var})`,
  paddingBlockStart: `calc(var(${space5Var}) * 0.5)`,
  paddingBlockEnd: `var(${space4Var})`,
  gap: `var(${space3Var})`,
  justifyContent: 'end',
})

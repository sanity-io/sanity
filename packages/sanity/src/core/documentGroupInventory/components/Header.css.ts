import {css} from '#styled-system/css'

/** `${space[4]}px` */
export const space4Var = '--header-space-4'
/** `${space[5]}px` */
export const space5Var = '--header-space-5'

export const header = css({
  minInlineSize: 0,
  paddingInline: `var(${space4Var})`,
  paddingBlockStart: `var(${space4Var})`,
  paddingBlockEnd: `calc(var(${space5Var}) * 0.5)`,
})

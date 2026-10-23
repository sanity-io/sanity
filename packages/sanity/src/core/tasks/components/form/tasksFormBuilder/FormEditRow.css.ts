import {css} from '#styled-system/css'

/** `${space[2]}px` */
export const space2Var = '--form-edit-row-space-2'
/** `${space[3]}px` */
export const space3Var = '--form-edit-row-space-3'

export const firstRow = css({
  columnGap: `var(${space2Var})`,
  rowGap: `var(${space3Var})`,
})

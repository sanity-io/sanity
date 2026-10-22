import {css} from '#styled-system/css'

/** `${radius[3]}px` */
export const radius3Var = '--variant-set-header-radius-3'

export const variantSetHeader = css({
  backgroundColor: 'var(--card-muted-bg-color)',
  borderRadius: `var(${radius3Var}) var(${radius3Var}) 0 0`,
})

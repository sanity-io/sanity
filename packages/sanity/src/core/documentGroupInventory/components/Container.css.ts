import {css} from '#styled-system/css'

/** `${container[0]}px` */
export const container0Var = '--container-0'
/** `${space[3]}px` */
export const space3Var = '--container-space-3'

export const container = css({
  display: 'grid',
  gridTemplateRows: 'min-content 1fr min-content',
  inlineSize: `min(calc(var(${container0Var}) * 1.5), calc(100vw - (var(${space3Var}) * 2)))`,
  maxBlockSize: '75vh',
  blockSize: 'var(--intrinsic-block-size, auto)',
})

import {createVar, style} from '@vanilla-extract/css'

/** `${container[0]}px` */
export const container0Var = createVar()
/** `${space[3]}px` */
export const space3Var = createVar()

export const container = style({
  display: 'grid',
  gridTemplateRows: 'min-content 1fr min-content',
  inlineSize: `min(calc(${container0Var} * 1.5), calc(100vw - (${space3Var} * 2)))`,
  maxBlockSize: '75vh',
  blockSize: 'var(--intrinsic-block-size, auto)',
})

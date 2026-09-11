import {createVar, style} from '@vanilla-extract/css'

export const stackWrapper = style({
  maxWidth: '200px',
})

export const listWrapperMaxHeightVar = createVar()

export const listWrapper = style({
  maxHeight: listWrapperMaxHeightVar,
  minWidth: '244px',
})

export const root = style({
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.2s',
})

// Defined after `root` so it wins the equal-specificity tie on `opacity` / `pointer-events`.
export const rootVisible = style({
  opacity: 1,
  pointerEvents: 'auto',
})

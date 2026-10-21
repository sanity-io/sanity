import {createVar, style} from '@vanilla-extract/css'

export const stackWrapper = style({
  maxWidth: '200px',
})

export const listWrapperMaxHeightVar = createVar()

export const listWrapper = style({
  maxHeight: listWrapperMaxHeightVar,
  selectors: {
    '&&': {
      minWidth: '244px',
    },
  },
})

export const root = style({
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.2s',
})

export const rootVisible = style({
  opacity: 1,
  pointerEvents: 'auto',
})

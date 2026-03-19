import {createVar, style} from '@vanilla-extract/css'

export const stackWrapper = style({
  selectors: {
    '&&': {
      maxWidth: '200px',
    },
  },
})

export const maxHeightVar = createVar()

export const listWrapper = style({
  selectors: {
    '&&': {
      maxHeight: maxHeightVar,
      minWidth: '244px',
    },
  },
})

export const rootVisible = style({
  selectors: {
    '&&': {
      opacity: 1,
      pointerEvents: 'auto',
      transition: 'opacity 0.2s',
    },
  },
})

export const rootHidden = style({
  selectors: {
    '&&': {
      opacity: 0,
      pointerEvents: 'none',
      transition: 'opacity 0.2s',
    },
  },
})

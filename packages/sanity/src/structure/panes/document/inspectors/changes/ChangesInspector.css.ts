import {style} from '@vanilla-extract/css'

export const scroller = style({
  selectors: {
    '&&': {
      height: '100%',
      overflow: 'auto',
      position: 'relative',
      scrollBehavior: 'smooth',
    },
  },
})

export const grid = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'grid',
    },
    '&&': {
      gridTemplateColumns: '48px 1fr',
      alignItems: 'center',
      gap: '0.25em',
    },
  },
})

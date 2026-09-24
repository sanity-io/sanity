import {style} from '@vanilla-extract/css'

export const containerFlex = style({
  maxWidth: '480px',
  overflow: ['hidden', 'clip'],
  width: '100%',
  selectors: {
    // Override the default `min-width: 0` ui5's Box applies via `.sui-min-width`
    '&&': {
      minWidth: '150px',
    },
  },
})

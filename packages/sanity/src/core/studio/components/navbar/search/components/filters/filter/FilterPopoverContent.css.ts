import {style} from '@vanilla-extract/css'

export const containerFlex = style({
  maxWidth: '480px',
  overflow: ['hidden', 'clip'],
  width: '100%',
  selectors: {
    '&&': {
      minWidth: '150px',
    },
  },
})

import {style} from '@vanilla-extract/css'

export const container = style({
  selectors: {
    '&&': {
      overflowX: 'auto',
    },
  },
})

import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      overflow: 'hidden',
    },
  },
})

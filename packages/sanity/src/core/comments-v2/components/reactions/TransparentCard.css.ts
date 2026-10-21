import {style} from '@vanilla-extract/css'

export const transparentCard = style({
  selectors: {
    '&&': {
      background: 'none',
    },
  },
})

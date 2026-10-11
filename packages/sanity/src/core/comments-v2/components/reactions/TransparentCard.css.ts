import {style} from '@vanilla-extract/css'

export const transparentCard = style({
  selectors: {
    // Card sets background-color on itself
    '&&': {
      background: 'none',
    },
  },
})

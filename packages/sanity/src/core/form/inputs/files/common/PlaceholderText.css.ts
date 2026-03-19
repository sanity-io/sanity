import {style} from '@vanilla-extract/css'

export const rootFlex = style({
  selectors: {
    '&&': {
      pointerEvents: 'none',
    },
  },
})

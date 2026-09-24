import {style} from '@vanilla-extract/css'

export const contentFlex = style({
  selectors: {
    '&&': {
      minHeight: '100px',
    },
  },
})

import {style} from '@vanilla-extract/css'

export const floatingCard = style({
  selectors: {
    '&&:empty': {
      display: 'none',
    },
  },
})

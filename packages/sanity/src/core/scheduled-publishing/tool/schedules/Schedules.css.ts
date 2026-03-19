import {style} from '@vanilla-extract/css'

export const panel = style({
  selectors: {
    '&&': {
      width: 'auto',
    },
  },
})

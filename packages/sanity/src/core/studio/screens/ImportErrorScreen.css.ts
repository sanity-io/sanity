import {style} from '@vanilla-extract/css'

export const view = style({
  selectors: {
    '&&': {
      alignItems: 'center',
    },
  },
})

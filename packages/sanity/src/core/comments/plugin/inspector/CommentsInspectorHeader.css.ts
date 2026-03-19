import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      position: 'relative',
      zIndex: 1,
      lineHeight: 0,
    },
  },
})

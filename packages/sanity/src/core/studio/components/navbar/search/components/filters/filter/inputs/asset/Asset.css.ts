import {style} from '@vanilla-extract/css'

export const containerBox = style({
  selectors: {
    '&&': {
      width: 'min(calc(100vw - 40px), 320px)',
    },
  },
})

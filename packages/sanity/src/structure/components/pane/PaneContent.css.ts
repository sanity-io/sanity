import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      position: 'relative',
      outline: 'none',
    },
  },
})

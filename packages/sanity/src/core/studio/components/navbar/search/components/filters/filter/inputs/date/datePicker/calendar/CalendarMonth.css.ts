import {style} from '@vanilla-extract/css'

export const customGrid = style({
  selectors: {
    '&&': {
      gridTemplateColumns: 'repeat(7, minmax(44px, auto))',
    },
  },
})

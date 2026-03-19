import {style} from '@vanilla-extract/css'

export const thumbGrid = style({
  selectors: {
    '&&': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    },
  },
})

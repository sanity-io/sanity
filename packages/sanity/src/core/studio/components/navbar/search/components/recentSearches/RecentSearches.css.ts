import {style} from '@vanilla-extract/css'

export const recentSearchesBox = style({
  selectors: {
    '&&': {
      overflowX: 'hidden',
      overflowY: 'auto',
      position: 'relative',
    },
  },
})

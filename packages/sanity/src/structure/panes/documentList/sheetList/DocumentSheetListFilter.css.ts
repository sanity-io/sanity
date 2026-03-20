import {style} from '@vanilla-extract/css'

export const searchContainer = style({
  selectors: {
    '&&': {
      flexShrink: 0,
    },
  },
})

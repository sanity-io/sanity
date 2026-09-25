import {style} from '@vanilla-extract/css'

export const menu = style({
  maxWidth: '300px',
  selectors: {
    // `&&` beats Box's own `min-width: 0` (Menu renders a Box)
    '&&': {
      minWidth: '200px',
    },
  },
})

import {style} from '@vanilla-extract/css'

export const metaText = style({
  selectors: {
    // `&&`: Text sets `color` on itself at (0,1,0); double the class so `inherit` wins regardless
    // of stylesheet order.
    '&&': {
      color: 'inherit',
    },
  },
})

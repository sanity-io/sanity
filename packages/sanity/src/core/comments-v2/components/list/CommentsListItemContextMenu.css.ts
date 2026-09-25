import {style} from '@vanilla-extract/css'

export const floatingCard = style({
  selectors: {
    // `&&` beats Card's own `&:not([hidden]) {display: flex}` (0,2,0) from the `display` prop
    '&&:empty': {
      display: 'none',
    },
  },
})

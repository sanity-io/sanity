import {style} from '@vanilla-extract/css'

export const styledButton = style({
  selectors: {
    // Button sets `padding: 0` on its root; `&&` beats it regardless of sheet order.
    '&&': {
      padding: '3px 6px',
    },
  },
})

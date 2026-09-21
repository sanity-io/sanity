import {style} from '@vanilla-extract/css'

export const contentFlex = style({
  selectors: {
    // `&&` beats Flex's own `min-height` (ui5 Flex defaults `minHeight` to 0)
    '&&': {
      minHeight: '100px',
    },
  },
})

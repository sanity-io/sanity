import {globalStyle, style} from '@vanilla-extract/css'

import {AVATAR_SIZE} from './constants'

export const flexWrapper = style({})

globalStyle(`${flexWrapper} > div:first-child`, {
  flex: 1,
  minWidth: 0,
})

export const innerBox = style({
  height: `${AVATAR_SIZE}px`,
  verticalAlign: 'top',
  selectors: {
    // ui5's Flex defaults `min-width: 0` on itself through its `.sui-min-width` utility class
    // (0,1,0); the original only won that tie by styled-components injection order.
    '&&': {
      minWidth: '23px',
    },
  },
})

import {css} from '#styled-system/css'

import {AVATAR_SIZE} from './constants'

export const flexWrapper = css({
  '& > div:first-child': {
    flex: 1,
    minWidth: 0,
  },
})

export const innerBox = css({
  'height': `${AVATAR_SIZE}px`,
  'verticalAlign': 'top',
  // ui5's Flex defaults `min-width: 0` on itself through its `.sui-min-width` utility class
  // (0,1,0); the original only won that tie by styled-components injection order.
  '&&': {
    minWidth: '23px',
  },
})

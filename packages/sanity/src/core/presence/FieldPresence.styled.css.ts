import {css} from '#styled-system/css'

export const flexWrapper = css({
  '& > div:first-child': {
    flex: 1,
    minWidth: 0,
  },
})

export const innerBox = css({
  // `AVATAR_SIZE` (25px) in ./constants, written out because style values stay literal for the
  // build to rewrite this call statically. Change both together.
  'height': '25px',
  'verticalAlign': 'top',
  // ui5's Flex defaults `min-width: 0` on itself through its `.sui-min-width` utility class
  // (0,1,0); the original only won that tie by styled-components injection order.
  '&&': {
    minWidth: '23px',
  },
})

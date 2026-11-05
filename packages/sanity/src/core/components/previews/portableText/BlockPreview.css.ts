import {css} from '#styled-system/css'

import {PREVIEW_SIZES} from '../constants'

export const headerFlex = css({
  // Flex (Box) sets `min-height: 0` on itself
  '&&': {
    minHeight: `${PREVIEW_SIZES.block.media.height / 16}rem`,
  },
})

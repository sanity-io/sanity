import {style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

export const headerFlex = style({
  selectors: {
    '&&': {
      minHeight: `${PREVIEW_SIZES.block.media.height / 16}rem`,
    },
  },
})

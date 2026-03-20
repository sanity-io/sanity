import {style} from '@vanilla-extract/css'
import {rem} from '@sanity/ui'

import {PREVIEW_SIZES} from '../constants'

export const headerFlex = style({
  selectors: {
    '&&': {
      minHeight: rem(PREVIEW_SIZES.block.media.height),
    },
  },
})

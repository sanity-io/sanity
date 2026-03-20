import {style} from '@vanilla-extract/css'
import {rem} from '@sanity/ui'

import {PREVIEW_SIZES} from '../constants'

export const root = style({
  selectors: {
    '&&': {
      height: rem(PREVIEW_SIZES.compact.media.height),
      boxSizing: 'content-box',
    },
  },
})

export const titleSkeleton = style({
  selectors: {
    '&&': {
      maxWidth: rem(160),
      width: '80%',
    },
  },
})

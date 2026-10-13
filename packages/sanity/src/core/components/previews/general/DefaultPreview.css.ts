import {style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

export const root = style({
  selectors: {
    // Flex (Box) sets height and box-sizing on itself
    '&&': {
      height: `${PREVIEW_SIZES.default.media.height / 16}rem`,
      boxSizing: 'content-box',
    },
  },
})

export const titleSkeleton = style({
  maxWidth: `${160 / 16}rem`,
  selectors: {
    // TextSkeleton sets its own dimensions
    '&&': {
      width: '80%',
    },
  },
})

export const subtitleSkeleton = style({
  maxWidth: `${120 / 16}rem`,
  selectors: {
    // TextSkeleton sets its own dimensions
    '&&': {
      width: '60%',
    },
  },
})

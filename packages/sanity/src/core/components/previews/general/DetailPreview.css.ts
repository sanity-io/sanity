import {createVar, globalStyle, style} from '@vanilla-extract/css'
import {rem} from '@sanity/ui'

import {PREVIEW_SIZES} from '../constants'

export const rootFlex = style({
  selectors: {
    '&&': {
      height: rem(PREVIEW_SIZES.detail.media.height),
    },
  },
})

export const statusBox = style({
  whiteSpace: 'nowrap',
})

export const mediaSkeleton = style({
  selectors: {
    '&&': {
      width: rem(PREVIEW_SIZES.detail.media.width),
      height: rem(PREVIEW_SIZES.detail.media.height),
    },
  },
})

export const titleSkeleton = style({
  selectors: {
    '&&': {
      maxWidth: rem(160), /* 80% of 200px */
      width: '80%',
    },
  },
})

export const subtitleSkeleton = style({
  selectors: {
    '&&': {
      maxWidth: rem(120), /* 60% of 200px */
      width: '60%',
    },
  },
})

export const descriptionSkeleton = style({
  selectors: {
    '&&': {
      maxWidth: rem(180), /* 90% of 200px */
      width: '90%',
    },
  },
})

export const maxLinesVar = createVar()
export const maxHeightVar = createVar()

export const descriptionText = style({})

globalStyle(`${descriptionText} > span`, {
  maxHeight: maxHeightVar,
  display: '-webkit-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
})

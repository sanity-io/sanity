import {createVar, globalStyle, style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

export const rootFlex = style({
  selectors: {
    '&&': {
      height: `${PREVIEW_SIZES.detail.media.height / 16}rem`,
    },
  },
})

export const statusBox = style({
  whiteSpace: 'nowrap',
})

export const mediaSkeleton = style({
  selectors: {
    '&&': {
      width: `${PREVIEW_SIZES.detail.media.width / 16}rem`,
      height: `${PREVIEW_SIZES.detail.media.height / 16}rem`,
    },
  },
})

export const titleSkeleton = style({
  maxWidth: `${160 / 16}rem` /* 80% of 200px */,
  selectors: {
    '&&': {
      width: '80%',
    },
  },
})

export const subtitleSkeleton = style({
  maxWidth: `${120 / 16}rem` /* 60% of 200px */,
  selectors: {
    '&&': {
      width: '60%',
    },
  },
})

export const descriptionSkeleton = style({
  maxWidth: `${180 / 16}rem` /* 90% of 200px */,
  selectors: {
    '&&': {
      width: '90%',
    },
  },
})

export const descriptionTextMaxHeightVar = createVar()

export const descriptionText = style({})

// csstype marks `-webkit-box-orient` obsolete, but `-webkit-line-clamp` only clamps together with
// `display: -webkit-box` and this declaration, so it is kept exactly as the original rule had it
const webkitBoxOrientVertical = {WebkitBoxOrient: 'vertical'} as const

globalStyle(`${descriptionText}${descriptionText} > span`, {
  maxHeight: descriptionTextMaxHeightVar,

  /* Multi-line text overflow */
  display: '-webkit-box',
  overflow: ['hidden', 'clip'],
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  ...webkitBoxOrientVertical,
})

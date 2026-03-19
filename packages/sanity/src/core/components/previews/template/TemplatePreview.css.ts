import {globalStyle, style} from '@vanilla-extract/css'
import {rem} from '@sanity/ui'

import {PREVIEW_SIZES} from '../constants'

export const root = style({
  selectors: {
    '&&': {
      height: '100%',
    },
  },
})

globalStyle(`${root} a`, {
  color: 'currentColor',
  textDecoration: 'none',
})

globalStyle(`${root} svg[data-sanity-icon]`, {
  margin: '0',
})

export const headerFlex = style({
  selectors: {
    '&&': {
      height: rem(PREVIEW_SIZES.default.media.height),
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

export const subtitleSkeleton = style({
  selectors: {
    '&&': {
      maxWidth: rem(120),
      width: '60%',
    },
  },
})

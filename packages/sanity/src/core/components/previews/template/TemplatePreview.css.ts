import {globalStyle, style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

export const root = style({
  selectors: {
    '&&': {
      height: '100%',
    },
  },
})

globalStyle(`${root} a`, {
  textDecoration: 'none',
})

globalStyle(`${root}${root} a`, {
  color: 'currentColor',
})

globalStyle(`${root} svg[data-sanity-icon]`, {
  margin: 0,
})

export const headerFlex = style({
  selectors: {
    '&&': {
      height: `${PREVIEW_SIZES.default.media.height / 16}rem`,
    },
  },
})

export const titleSkeleton = style({
  maxWidth: `${160 / 16}rem`,
  selectors: {
    '&&': {
      width: '80%',
    },
  },
})

export const subtitleSkeleton = style({
  maxWidth: `${120 / 16}rem`,
  selectors: {
    '&&': {
      width: '60%',
    },
  },
})

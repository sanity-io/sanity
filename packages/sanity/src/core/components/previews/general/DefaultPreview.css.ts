import {style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

const rem = (value: number) => `${value / 16}rem`

export const rootStyle = style({
  height: rem(PREVIEW_SIZES.default.media.height),
  boxSizing: 'content-box',
})

export const titleSkeletonStyle = style({
  maxWidth: rem(160),
  width: '80%',
})

export const subtitleSkeletonStyle = style({
  maxWidth: rem(120),
  width: '60%',
})

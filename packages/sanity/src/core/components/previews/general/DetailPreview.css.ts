import {globalStyle, style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

import {PREVIEW_SIZES} from '../constants'

const rem = (value: number) => `${value / 16}rem`

export const rootFlexStyle = style({
  height: rem(PREVIEW_SIZES.detail.media.height),
})

export const statusBoxStyle = style({
  whiteSpace: 'nowrap',
})

export const mediaSkeletonStyle = style({
  width: rem(PREVIEW_SIZES.detail.media.width),
  height: rem(PREVIEW_SIZES.detail.media.height),
})

export const titleSkeletonStyle = style({
  maxWidth: rem(160),
  width: '80%',
})

export const subtitleSkeletonStyle = style({
  maxWidth: rem(120),
  width: '60%',
})

export const descriptionSkeletonStyle = style({
  maxWidth: rem(180),
  width: '90%',
})

export const descriptionTextStyle = style({})

// Apply multi-line text overflow to descendant spans
const textSize1 = vars.font.text.scale[1]
const maxLines = 2
const maxHeight = `calc(${textSize1.lineHeight} * ${maxLines})`

globalStyle(`${descriptionTextStyle} > span`, {
  maxHeight,
  display: '-webkit-box',
  overflow: 'clip',
  textOverflow: 'ellipsis',
  WebkitLineClamp: maxLines,
  WebkitBoxOrient: 'vertical',
})

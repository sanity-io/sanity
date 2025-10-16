import {globalStyle, style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

import {PREVIEW_SIZES} from '../constants'

export const headerFlexStyle = style({
  height: `${PREVIEW_SIZES.block.media.height}px`,
  whiteSpace: 'nowrap',
  position: 'relative',
  zIndex: 1,
})

export const mediaCardStyle = style({
  overflow: 'hidden',
  position: 'relative',
})

globalStyle(`${mediaCardStyle} > span`, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})

export const rootBoxStyle = style({
  borderRadius: vars.radius[1],
})

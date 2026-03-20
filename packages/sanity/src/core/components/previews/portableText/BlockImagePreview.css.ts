import {createVar, globalStyle, style} from '@vanilla-extract/css'
import {rem} from '@sanity/ui'

import {PREVIEW_SIZES} from '../constants'

export const headerFlex = style({
  selectors: {
    '&&': {
      height: rem(PREVIEW_SIZES.block.media.height),
      whiteSpace: 'nowrap',
      position: 'relative',
      zIndex: 1,
    },
  },
})

export const ratioVar = createVar()

export const mediaCard = style({
  selectors: {
    '&&': {
      overflow: 'hidden',
      position: 'relative',
      paddingBottom: ratioVar,
    },
  },
})

globalStyle(`${mediaCard} > span`, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})

export const radiusVar = createVar()

export const rootBox = style({
  selectors: {
    '&&': {
      borderRadius: radiusVar,
    },
  },
})

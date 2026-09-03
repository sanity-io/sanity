import {createVar, globalStyle, style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

export const headerFlex = style({
  whiteSpace: 'nowrap',
  position: 'relative',
  zIndex: 1,
  selectors: {
    // Flex (Box) sets height on itself
    '&&': {
      height: `${PREVIEW_SIZES.block.media.height / 16}rem`,
    },
  },
})

export const mediaCardRatioVar = createVar()

export const mediaCard = style({
  position: 'relative',
  selectors: {
    // Card (Box) sets overflow and padding on itself
    '&&': {
      overflow: 'hidden',
      paddingBottom: mediaCardRatioVar,
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

export const rootBoxRadiusVar = createVar()

export const rootBox = style({
  borderRadius: rootBoxRadiusVar,
})

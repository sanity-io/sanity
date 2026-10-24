import {css} from '#styled-system/css'

import {PREVIEW_SIZES} from '../constants'

export const headerFlex = css({
  'whiteSpace': 'nowrap',
  'position': 'relative',
  'zIndex': 1,
  // Flex (Box) sets height on itself
  '&&': {
    height: `${PREVIEW_SIZES.block.media.height / 16}rem`,
  },
})

export const mediaCardRatioVar = '--block-image-preview-media-card-ratio'

export const mediaCard = css({
  'position': 'relative',
  // Card (Box) sets overflow and padding on itself
  '&&': {
    overflow: 'hidden',
    paddingBottom: `var(${mediaCardRatioVar})`,
  },
  '& > span': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

export const rootBoxRadiusVar = '--block-image-preview-root-box-radius'

export const rootBox = css({
  borderRadius: `var(${rootBoxRadiusVar})`,
})

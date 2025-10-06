import {style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

const rem = (value: number) => `${value / 16}rem`

export const headerFlexStyle = style({
  minHeight: rem(PREVIEW_SIZES.block.media.height),
})

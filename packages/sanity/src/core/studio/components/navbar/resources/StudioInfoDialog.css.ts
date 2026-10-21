import {globalStyle, style} from '@vanilla-extract/css'

const MONOGRAM_SIZE = 75 // width and height, px

export const monogramContainer = style({
  height: `${MONOGRAM_SIZE}px`,
  width: `${MONOGRAM_SIZE}px`,
})

export const truncateBadge = style({})

// Badge wraps its children in `<Text><span>…</span></Text>`; this targets that span.
globalStyle(`${truncateBadge} span`, {
  display: 'block',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'clip',
})

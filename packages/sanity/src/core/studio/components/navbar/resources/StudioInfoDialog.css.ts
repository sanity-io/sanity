import {css} from '#styled-system/css'

const MONOGRAM_SIZE = 75 // width and height, px

export const monogramContainer = css({
  height: `${MONOGRAM_SIZE}px`,
  width: `${MONOGRAM_SIZE}px`,
})

export const truncateBadge = css({
  // Kept at single-class specificity on purpose: Badge's own
  // `&:not([hidden]) { display: inline-block }` (0,2,0) outranked this declaration in the
  // original too, so the badge keeps rendering inline-block.
  'display': 'block',
  // Badge wraps its children in `<Text><span>…</span></Text>`; this targets that span.
  '& span': {
    display: 'block',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'clip',
  },
})

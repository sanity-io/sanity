import {style} from '@vanilla-extract/css'

export const optionObserveElement = style({
  listStyle: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  opacity: 0,
  visibility: 'hidden',
})

export const hiddenRow = style({
  opacity: 0,
  height: '0.1px',
  overflow: 'hidden',
  // Cancels out the height above so the row takes up no layout space. Without it the
  // fraction rounds up and the navbar renders 51px high instead of 50px, out of
  // alignment with the Sanity dashboard UI around the studio
  marginTop: '-0.1px',
  pointerEvents: 'none',
})

export const menuButtonPlaceholder = style({
  display: 'flex',
  visibility: 'hidden',
})

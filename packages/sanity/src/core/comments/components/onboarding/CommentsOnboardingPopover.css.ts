import {keyframes, style} from '@vanilla-extract/css'

export const root = style({
  maxWidth: '280px',
})

const fadeIn = keyframes({
  from: {opacity: 0},
  to: {opacity: 1},
})

export const styledPopover = style({
  opacity: 0,
  // Fade in the popover after 500ms
  animation: `${fadeIn} 200ms 500ms forwards`,
})

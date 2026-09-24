import {keyframes, style} from '@vanilla-extract/css'

export const root = style({
  maxWidth: '280px',
})

const fadeInKeyFrame = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
})

export const styledPopover = style({
  opacity: 0,
  // Fade in the popover after 500ms
  animation: `${fadeInKeyFrame} 200ms 500ms forwards`,
})

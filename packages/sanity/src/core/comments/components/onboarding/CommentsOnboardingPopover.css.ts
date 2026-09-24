import {css, keyframes} from '#styled-system/css'

export const root = css({
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

export const styledPopover = css({
  opacity: 0,
  // Fade in the popover after 500ms
  animation: `${fadeInKeyFrame} 200ms 500ms forwards`,
})

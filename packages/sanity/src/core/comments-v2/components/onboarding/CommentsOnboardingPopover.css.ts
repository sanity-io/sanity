import {css, keyframes} from '#styled-system/css'

export const root = css({
  maxWidth: '280px',
})

const fadeIn = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
})

export const popover = css({
  opacity: 0,
  // Fade in the popover after 500ms
  animation: `${fadeIn} 200ms 500ms forwards`,
})

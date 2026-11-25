import {css, keyframes} from '#styled-system/css'

const fadeInKeyframes = keyframes({
  from: {opacity: 0},
  to: {opacity: 1},
})

const pulseKeyframes = keyframes({
  '0%, 100%': {opacity: 0.5},
  '50%': {opacity: 1},
})

// Split across two elements. One `animation` shorthand cannot change the pulse
// without restarting the fade, and restarting the fade makes the settled
// snapshot start at opacity 0.
export const fadeIn = css({
  animation: `${fadeInKeyframes} 0.3s ease-out`,
})

export const pulse = css({
  animation: `${pulseKeyframes} 1.8s ease-in-out infinite`,
})

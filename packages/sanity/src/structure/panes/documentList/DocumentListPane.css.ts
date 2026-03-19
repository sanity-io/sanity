import {keyframes, style} from '@vanilla-extract/css'

const rotate = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '50%': { opacity: 0.1 },
  '100%': { opacity: 0.4 },
})

export const animatedSpinnerIcon = style({
  animation: `${rotate} 500ms linear infinite`,
})

export const subtleSpinnerIcon = style({
  animation: `${rotate} 1500ms linear infinite`,
  opacity: 0.4,
})

export const delayedSubtleSpinnerIcon = style({
  animation: `${rotate} 1500ms linear infinite, ${fadeIn} 1000ms linear`,
  opacity: 0.4,
})

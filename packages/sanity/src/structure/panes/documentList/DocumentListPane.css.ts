import {keyframes, style} from '@vanilla-extract/css'

const rotate = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
})

const fadeIn = keyframes({
  '0%': {
    opacity: 0,
  },
  '50%': {
    opacity: 0.1,
  },
  '100%': {
    opacity: 0.4,
  },
})

const sizedSpinnerIcon = style({
  height: 'round(1em, 2px)',
  width: 'round(1em, 2px)',
})

export const animatedSpinnerIcon = style([
  sizedSpinnerIcon,
  {
    animation: `${rotate} 500ms linear infinite`,
  },
])

export const subtleSpinnerIcon = style([
  sizedSpinnerIcon,
  {
    animation: `${rotate} 1500ms linear infinite`,
    opacity: 0.4,
  },
])

export const delayedSubtleSpinnerIcon = style([
  sizedSpinnerIcon,
  {
    animation: `${rotate} 1500ms linear infinite, ${fadeIn} 1000ms linear`,
    opacity: 0.4,
  },
])

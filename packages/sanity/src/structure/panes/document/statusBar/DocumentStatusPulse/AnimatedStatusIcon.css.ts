import {keyframes, style} from '@vanilla-extract/css'

export const motionPath = style({
  transformOrigin: 'center',
})

const rotateAnimation = keyframes({
  '0%': {
    transform: 'rotate(0)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
})

export const rotateGroup = style({
  transformOrigin: 'center',
  selectors: {
    '&[data-rotate]': {
      animation: `${rotateAnimation} 1s ease-in-out infinite`,
    },
  },
})

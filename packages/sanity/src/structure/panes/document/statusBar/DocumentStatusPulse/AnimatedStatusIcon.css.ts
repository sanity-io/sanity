import {keyframes, style} from '@vanilla-extract/css'

export const styledMotionPath = style({
  transformOrigin: 'center',
})

const rotateAnimation = keyframes({
  '0%': { transform: 'rotate(0)' },
  '100%': { transform: 'rotate(360deg)' },
})

export const rotateGroup = style({
  transformOrigin: 'center',
})

export const rotateGroupAnimating = style({
  transformOrigin: 'center',
  animation: `${rotateAnimation} 1s ease-in-out infinite`,
})

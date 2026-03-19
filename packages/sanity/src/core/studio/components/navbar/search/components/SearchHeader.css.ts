import {keyframes, style} from '@vanilla-extract/css'

const rotate = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

export const animatedSpinnerIcon = style({
  animation: `${rotate} 500ms linear infinite`,
})

export const filterDiv = style({
  lineHeight: 0,
  position: 'relative',
})

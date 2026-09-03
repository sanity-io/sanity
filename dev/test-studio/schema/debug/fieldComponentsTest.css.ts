import {keyframes, style} from '@vanilla-extract/css'

const spin = keyframes({
  from: {transform: 'rotate(0)'},
  to: {transform: 'rotate(180deg)'},
})

export const customBox = style({
  animation: `3s linear 0s infinite normal none ${spin}`,
  background: 'white',
  border: '1px solid black',
  cursor: 'pointer',
  height: 40,
  width: 40,
  selectors: {
    '&:hover': {
      background: 'red',
    },
  },
})

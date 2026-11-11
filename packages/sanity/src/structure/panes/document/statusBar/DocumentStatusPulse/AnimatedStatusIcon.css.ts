import {css, keyframes} from '#styled-system/css'

export const motionPath = css({
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

export const rotateGroup = css({
  'transformOrigin': 'center',
  '&[data-rotate]': {
    animation: `${rotateAnimation} 1s ease-in-out infinite`,
  },
})

import {css, keyframes} from '#styled-system/css'

const rotate = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
})

export const animatedSpinnerIcon = css({
  animation: `${rotate} 500ms linear infinite`,
  height: 'round(1em, 2px)',
  width: 'round(1em, 2px)',
})

export const filterDiv = css({
  lineHeight: 0,
  position: 'relative',
})

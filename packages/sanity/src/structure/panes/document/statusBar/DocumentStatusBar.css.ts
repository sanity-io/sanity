import {css, keyframes} from '#styled-system/css'

const fadeIn = keyframes({
  from: {opacity: 0.2},
  to: {opacity: 1},
})

export const root = css({
  animation: `${fadeIn} 0.3s ease-out`,
})

import {css, keyframes} from '#styled-system/css'

const enter = keyframes({
  from: {opacity: 0, scale: '0.95'},
  to: {opacity: 1, scale: '1'},
})

export const panel = css({
  animation: `${enter} 0.2s ease-out`,
})

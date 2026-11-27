import {css, keyframes} from '#styled-system/css'

const enter = keyframes({
  from: {opacity: 0, translate: '0 -4px'},
  to: {opacity: 1, translate: '0 0'},
})

export const popover = css({
  userSelect: 'none',
  animation: `${enter} 0.3s ease-out`,
})

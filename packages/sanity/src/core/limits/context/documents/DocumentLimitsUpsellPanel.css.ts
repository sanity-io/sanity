import {css, keyframes} from '#styled-system/css'

const enter = keyframes({
  from: {opacity: 0, scale: '0.95'},
})

export const root = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${enter} 0.2s ease-out`,
  },
})

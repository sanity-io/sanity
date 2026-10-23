import {css, keyframes} from '#styled-system/css'

const fadeIn = keyframes({
  from: {opacity: 0.2},
})

export const root = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.3s ease-out`,
  },
})

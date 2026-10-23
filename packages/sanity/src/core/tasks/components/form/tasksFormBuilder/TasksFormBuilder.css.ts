import {css, keyframes} from '#styled-system/css'

const fadeIn = keyframes({
  from: {opacity: 0},
})

export const formBuilderRoot = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.2s ease-out 0.2s backwards`,
  },
})

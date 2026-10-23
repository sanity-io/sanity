import {css, keyframes} from '#styled-system/css'

const fadeIn = keyframes({
  from: {opacity: 0},
})

export const expandingLoader = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.2s ease-out 0.2s backwards`,
  },
})

export const childItem = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.3s cubic-bezier(0.25, 0.1, 0.35, 1)`,
  },
})

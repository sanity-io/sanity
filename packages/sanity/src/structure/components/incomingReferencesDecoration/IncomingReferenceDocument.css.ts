import {css, keyframes} from '#styled-system/css'

const fadeIn = keyframes({
  from: {opacity: 0},
})

const pulse = keyframes({
  '0%, 100%': {opacity: 0.5},
  '50%': {opacity: 1},
})

export const root = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.3s cubic-bezier(0.25, 0.1, 0.35, 1)`,
    // Eases back from wherever the pulse was when the action finishes
    transition: 'opacity 0.3s cubic-bezier(0.25, 0.1, 0.35, 1)',
  },
})

// `fadeIn` stays first in the list so that adding the pulse does not restart it
export const executingAction = css({
  '@media (prefers-reduced-motion: no-preference)': {
    '&&': {
      animation: `${fadeIn} 0.3s cubic-bezier(0.25, 0.1, 0.35, 1), ${pulse} 1.8s ease-in-out infinite`,
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '&&': {opacity: 0.5},
  },
})

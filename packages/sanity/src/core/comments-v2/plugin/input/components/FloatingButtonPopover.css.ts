import {css, keyframes} from '#styled-system/css'

const fadeIn = keyframes({
  from: {opacity: 0},
})

// `translate` rather than `transform`, which the popover's own scale animation owns
const slideIn = keyframes({
  from: {translate: '0 -4px'},
})

export const popover = css({
  'userSelect': 'none',
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.3s cubic-bezier(0.25, 0.1, 0.35, 1), ${slideIn} 285ms linear(0, 0.06, 0.205, 0.39, 0.58, 0.753, 0.895, 1, 1.069, 1.107, 1.12, 1.115, 1.099, 1.077, 1.054, 1.033, 1.015, 1.002, 1)`,
  },
})

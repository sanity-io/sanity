import {css, keyframes} from '#styled-system/css'

export const spinnerContainer = css({
  width: '100%',
  position: 'absolute',
  bottom: '-4px',
})

const fadeIn = keyframes({
  from: {opacity: 0},
})

export const delayedFadeIn = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.2s ease-out 0.2s backwards`,
  },
})

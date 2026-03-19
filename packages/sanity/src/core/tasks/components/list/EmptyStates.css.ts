import {keyframes, style} from '@vanilla-extract/css'

export const root = style({
  maxWidth: '268px',
  margin: '0 auto',
  height: '100%',
  marginTop: '40%',
})

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

export const animatedText = style({
  selectors: {
    '&&': {
      animation: `${fadeIn} 0.2s ease-in-out`,
    },
  },
})

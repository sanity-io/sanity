import {css, keyframes} from '#styled-system/css'

export const root = css({
  maxWidth: '268px',
  margin: '0 auto',
  height: '100%',
  marginTop: '40%',
})

const fadeIn = keyframes({
  from: {opacity: 0},
  to: {opacity: 1},
})

export const animatedText = css({
  animation: `${fadeIn} 0.2s ease-in-out`,
})

import {css} from '#styled-system/css'

export const root = css({
  'display': 'inline-block',
  'overflow': 'visible',
  '&[data-animating]': {overflow: 'hidden'},
  '@media (prefers-reduced-motion: no-preference)': {
    // A critically damped spring that settles in 0.3s, sampled from motion's spring solver
    transition: 'width 0.3s linear(0, 0.274, 0.608, 0.812, 0.916, 0.964, 0.985, 0.994, 0.997, 1)',
  },
})

export const text = css({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
})

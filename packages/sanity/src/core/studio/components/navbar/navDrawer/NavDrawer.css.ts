import {css} from '#styled-system/css'

export const root = css({
  'top': 0,
  'left': 0,
  'width': '100%',
  'height': '100%',
  // `&&` beats Layer's own `position: relative`
  '&&': {
    position: 'fixed',
  },
})

export const backdrop = css({
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'right': 0,
  'bottom': 0,
  // `&&` beats Card's own `background-color`
  '&&': {
    background: 'var(--card-shadow-penumbra-color)',
  },
})

export const innerCard = css({
  'position': 'relative',
  'pointerEvents': 'all',
  'flexDirection': 'column',
  'maxWidth': '280px',
  'overflow': 'auto',
  // `&&` beats Box's own `height` (set through the `height="fill"` prop) and its flex-item
  // `min-width: 0`, which every Box sets on itself
  '&&': {
    height: '100%',
    minWidth: '200px',
  },
})

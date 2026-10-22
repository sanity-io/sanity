import {css} from '#styled-system/css'

export const listItemMoving = css({
  zIndex: 10000,
  /* prevents hover-effects etc on the dragged element  */
  pointerEvents: 'none',
})

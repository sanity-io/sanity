import {style} from '@vanilla-extract/css'

/** Plain class name added to the item being dragged; layouts select on it. */
export const MOVING_ITEM_CLASS_NAME = 'moving'

export const listItemMoving = style({
  zIndex: 10000,
  /* prevents hover-effects etc on the dragged element  */
  pointerEvents: 'none',
})

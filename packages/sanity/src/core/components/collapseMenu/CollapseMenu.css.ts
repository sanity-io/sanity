import {style} from '@vanilla-extract/css'

const FOCUS_RING_PADDING = 3

// Box sets `padding`, `margin` and `box-sizing` on itself, so the override needs `&&`.
export const outerFlex = style({
  selectors: {
    '&&': {
      padding: `${FOCUS_RING_PADDING}px`,
      margin: `-${FOCUS_RING_PADDING}px`,
      boxSizing: 'border-box',
    },
  },
})

export const rootFlex = style({
  borderRadius: 'inherit',
  position: 'relative',
})

export const rowFlex = style({
  width: 'max-content',
  selectors: {
    "&[data-hidden='true']": {
      visibility: 'hidden',
      position: 'relative',
      marginTop: '-1px',
      height: '1px',
    },
  },
})

export const optionObserveElement = style({
  listStyle: 'none',
  display: 'flex',
  whiteSpace: 'nowrap',
  selectors: {
    "&[data-hidden='true']": {
      opacity: 0,
      visibility: 'hidden',
    },
  },
})

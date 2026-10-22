import {css} from '#styled-system/css'

const FOCUS_RING_PADDING = 3

// Box sets `padding`, `margin` and `box-sizing` on itself, so the override needs `&&`.
export const outerFlex = css({
  '&&': {
    padding: `${FOCUS_RING_PADDING}px`,
    margin: `-${FOCUS_RING_PADDING}px`,
    boxSizing: 'border-box',
  },
})

export const rootFlex = css({
  borderRadius: 'inherit',
  position: 'relative',
})

export const rowFlex = css({
  'width': 'max-content',
  "&[data-hidden='true']": {
    visibility: 'hidden',
    position: 'relative',
    marginTop: '-1px',
    height: '1px',
  },
})

export const optionObserveElement = css({
  'listStyle': 'none',
  'display': 'flex',
  'whiteSpace': 'nowrap',
  "&[data-hidden='true']": {
    opacity: 0,
    visibility: 'hidden',
  },
})

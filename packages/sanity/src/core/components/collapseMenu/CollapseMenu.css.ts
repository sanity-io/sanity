import {style} from '@vanilla-extract/css'

const FOCUS_RING_PADDING = 3

export const optionStyle = style({
  listStyle: 'none',
  display: 'flex',
  whiteSpace: 'nowrap',
  selectors: {
    '&[data-hidden="true"]': {
      opacity: 0,
      visibility: 'hidden',
    },
  },
})

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
  selectors: {
    '&&': {
      borderRadius: 'inherit',
      position: 'relative',
    },
  },
})

export const rowFlex = style({
  selectors: {
    '&&': {
      width: 'max-content',
    },
    '&&[data-hidden="true"]': {
      visibility: 'hidden',
      position: 'relative',
      marginTop: '-1px',
      height: '1px',
    },
  },
})

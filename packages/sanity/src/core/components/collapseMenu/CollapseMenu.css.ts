import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

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

export const outerFlexStyle = style({
  padding: `${FOCUS_RING_PADDING}px`,
  margin: `-${FOCUS_RING_PADDING}px`,
  boxSizing: 'border-box',
})

export const rootFlexStyle = style({
  borderRadius: 'inherit',
  position: 'relative',
})

export const rowFlexStyle = style({
  width: 'max-content',
  selectors: {
    '&[data-hidden="true"]': {
      visibility: 'hidden',
      position: 'relative',
      marginTop: '-1px',
      height: '1px',
    },
  },
})
